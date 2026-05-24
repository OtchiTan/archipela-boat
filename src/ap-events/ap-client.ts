import { Client, Player } from 'archipelago.js';
import { ApDeathlinksService } from 'src/ap-deathlinks/ap-deathlinks.service';
import { ApEventsService } from 'src/ap-events/ap-events.service';
import { ApGamesService } from 'src/ap-games/ap-games.service';
import { DiscordError } from 'src/core/discord.error';
import { IsNull } from 'typeorm';
import { ApEvent } from './ap-events.entity';

export class ApClient {
  public client = new Client();
  public event?: ApEvent;
  public retryTimeout?: NodeJS.Timeout;

  constructor(
    private readonly apEventsService: ApEventsService,
    private readonly apDeathlinksService: ApDeathlinksService,
    private readonly apGamesService: ApGamesService,
  ) {}

  async connectClient(url: string) {
    this.event =
      (await this.apEventsService.findEvent({ url, endTime: IsNull() })) ??
      undefined;

    if (this.event === undefined) {
      throw new DiscordError(
        "Il n'y à pas d'êvenement démarré dans ce channel",
      );
    }

    try {
      await this.client.login(url, this.event.games[0].slot ?? '', '', {
        tags: ['AP', 'Tracker', 'DeathLink'],
      });
    } catch {
      this.reconnectClient(url).catch((err) => console.error(err));
      return;
    }

    if (this.retryTimeout?.hasRef) {
      clearTimeout(this.retryTimeout);
    }

    await this.apEventsService.updateEvent(this.event.id, {
      clientConnected: true,
    });

    this.client.socket.on('disconnected', () => {
      this.reconnectClient(url).catch((err) => console.error(err));
    });

    this.client.deathLink.on('deathReceived', (slot, timestamp, cause) => {
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
    if (this.event === undefined) {
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
    if (this.event === undefined) {
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

  async reconnectClient(url: string) {
    if (!this.event) {
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
      this.connectClient(url).catch((err) => console.error(err));
    }, 3000);
  }

  async disconnectClient() {
    if (!this.event) {
      return;
    }

    await this.apEventsService.updateEvent(this.event.id, {
      clientConnected: false,
    });

    if (this.retryTimeout?.hasRef()) {
      clearTimeout(this.retryTimeout);
    }
  }

  async onDeathlinkReceived(slot: string, timestamp: number, cause?: string) {
    if (this.event === undefined) {
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
