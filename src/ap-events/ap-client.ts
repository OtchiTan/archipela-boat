import { Client, Player } from 'archipelago.js';
import { ApEventsService } from 'src/ap-events/ap-events.service';
import { ApGamesService } from 'src/ap-games/ap-games.service';
import { ApPlayersService } from 'src/ap-players/ap-players.service';
import { DiscordError } from 'src/core/discord.error';
import { ApEvent } from './ap-events.entity';

export class ApClient {
  public client = new Client();
  public event: ApEvent | null = null;

  constructor(
    private readonly apEventsService: ApEventsService,
    private readonly apPlayersService: ApPlayersService,
    private readonly apGamesService: ApGamesService,
  ) {}

  async connectClient(url: string) {
    this.event = await this.apEventsService.findEvent({ url });

    if (this.event === null) {
      throw new DiscordError(
        "Il n'y à pas d'êvenement démarré dans ce channel",
      );
    }

    try {
      await this.client.login(url, this.event.games[0].slot ?? '', '', {
        tags: ['AP', 'Tracker', 'DeathLink'],
      });
    } catch {
      this.apEventsService.closeApClient(url);
    }

    this.client.deathLink.on('deathReceived', (slot, timestamp, cause) => {
      if (this.event === null) {
        return;
      }

      this.apGamesService
        .increaseDeathlinkCount(this.event, slot, timestamp, cause)
        .catch((err) => {
          console.log(err);
        });
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
    if (this.event === null) {
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
    if (this.event === null) {
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

  extractTags(str: string): string[] {
    const match = str.match(/\[(.*?)\]/);

    if (!match || !match[1]) {
      return [];
    }

    return match[1].split(',').map((tag) => tag.trim().replace(/['"]/g, ''));
  }
}
