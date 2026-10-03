import { Client, Player } from 'archipelago.js';
import { DiscordError } from 'src/core/discord.error';
import { FindOptionsWhere, IsNull, Not } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/browser';
import { ApEvent } from './ap-events.entity';

export interface ApClientEvents {
  findEvent(filter: FindOptionsWhere<ApEvent>): Promise<ApEvent | null>;
  updateEvent(
    eventId: number,
    data: QueryDeepPartialEntity<ApEvent>,
  ): Promise<void>;
}

export interface ApClientDeathlinks {
  getLatestDeathlink(eventId: number): Promise<{ timestamp: Date } | null>;
}

export interface ApClientGames {
  startSession(event: ApEvent, slot: string, deathlink: boolean): Promise<void>;
  stopSession(event: ApEvent, slot: string): Promise<void>;
  increaseDeathlinkCount(
    event: ApEvent,
    slot: string,
    timestamp: number,
    cause: string | undefined,
  ): Promise<void>;
}

export class ApClient {
  public client = new Client();
  public event?: ApEvent;
  public retryTimeout?: NodeJS.Timeout;
  private stopped = false;

  constructor(
    private readonly apEventsService: ApClientEvents,
    private readonly apDeathlinksService: ApClientDeathlinks,
    private readonly apGamesService: ApClientGames,
  ) {}

  async connectClient(eventId: number, reportConnectionFailure = false) {
    this.event =
      (await this.apEventsService.findEvent({
        id: eventId,
        url: Not(IsNull()),
        startTime: Not(IsNull()),
        endTime: IsNull(),
      })) ?? undefined;

    if (this.event === undefined || this.stopped) {
      throw new DiscordError(
        "Il n'y à pas d'êvenement démarré dans ce channel",
      );
    }

    const url = this.event.url!;

    try {
      console.log('Login');
      await this.client.login(url, this.event.games[0].slot ?? '', '', {
        tags: ['Tracker', 'DeathLink'],
      });
    } catch (error) {
      console.error(error);
      this.reconnectClient(eventId).catch((err) => console.error(err));
      if (reportConnectionFailure) {
        throw new DiscordError(
          "Impossible de se connecter au serveur Archipelago. Vérifiez l'URL et le port ; une nouvelle tentative sera effectuée.",
        );
      }
      return;
    }

    if (this.retryTimeout?.hasRef()) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = undefined;
    }

    await this.apEventsService.updateEvent(this.event.id, {
      clientConnected: true,
    });

    this.client.socket.on('disconnected', () => {
      this.reconnectClient(eventId).catch((err) => console.error(err));
    });

    this.client.deathLink.on('deathReceived', (slot, timestamp, cause) => {
      console.log('On Deathlink received');
      this.onDeathlinkReceived(slot, timestamp, cause).catch((err) =>
        console.error(err),
      );
    });

    this.client.messages.on('connected', (text, player, tags) => {
      this.onClientConnected(text, player, tags).catch((err) => {
        console.error(err);
      });
    });

    this.client.messages.on('disconnected', (text, player) => {
      this.onClientDisconnected(text, player).catch((err) => {
        console.error(err);
      });
    });

    this.client.messages.on('tagsUpdated', (text, player, tags) => {
      this.onClientConnected(text, player, tags).catch((err) => {
        console.error(err);
      });
    });

    console.log('Client connected on url : ' + url);
  }

  async onClientConnected(text: string, player: Player, tags: string[]) {
    if (this.event === undefined || this.stopped) {
      return;
    }

    if (!this.isGame(tags)) {
      return;
    }

    await this.apGamesService.startSession(
      this.event,
      player.name,
      tags.includes('DeathLink'),
    );
  }

  async onClientDisconnected(text: string, player: Player) {
    if (this.event === undefined || this.stopped) {
      return;
    }

    if (!this.isGame(this.extractTags(text))) {
      return;
    }

    await this.apGamesService.stopSession(this.event, player.name);
  }

  isGame(tags: string[]): boolean {
    return !tags.some((tag) =>
      ['TextOnly', 'Tracker', 'HintGame'].includes(tag),
    );
  }

  async reconnectClient(eventId: number) {
    if (!this.event || this.stopped) {
      return;
    }

    try {
      await this.apEventsService.updateEvent(this.event.id, {
        clientConnected: false,
      });
    } catch (error) {
      console.error(error);
    }

    if (this.retryTimeout?.hasRef()) {
      clearTimeout(this.retryTimeout);
    }

    this.retryTimeout = setTimeout(() => {
      if (!this.stopped) {
        this.connectClient(eventId).catch((err) => console.error(err));
      }
    }, 3000);
  }

  async disconnectClient() {
    this.stopped = true;

    if (this.retryTimeout?.hasRef()) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = undefined;
    }

    this.client.socket.disconnect();

    if (this.event) {
      await this.apEventsService.updateEvent(this.event.id, {
        clientConnected: false,
      });
    }
  }

  async onDeathlinkReceived(slot: string, timestamp: number, cause?: string) {
    if (this.event === undefined || this.stopped) {
      return;
    }

    const latestDeathlink = await this.apDeathlinksService.getLatestDeathlink(
      this.event.id,
    );

    if (latestDeathlink) {
      const start = latestDeathlink.timestamp.getTime();
      const end = new Date(timestamp).getTime();
      if (end - start < 2000) {
        return;
      }
    }

    await this.apGamesService.increaseDeathlinkCount(
      this.event,
      slot,
      timestamp,
      cause,
    );
  }

  extractTags(str: string): string[] {
    const match = str.match(/\[(.*?)\]/);

    if (!match || !match[1]) {
      return [];
    }

    return match[1].split(',').map((tag) => tag.trim().replace(/['"]/g, ''));
  }
}
