import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { ApDeathlink } from 'src/ap-deathlinks/ap-deathlinks.entity';
import { ApDeathlinksService } from 'src/ap-deathlinks/ap-deathlinks.service';
import { ApEvent } from 'src/ap-events/ap-events.entity';
import { ApSessionsService } from 'src/ap-sessions/ap-sessions.service';
import { ApGamesService } from '../ap-games.service';

@Injectable()
export class IncreaseDeathlinkCountUseCase {
  constructor(
    @Inject(forwardRef(() => ApGamesService))
    private apGamesService: ApGamesService,
    @Inject(forwardRef(() => ApSessionsService))
    private apSessionsService: ApSessionsService,
    @Inject(forwardRef(() => ApDeathlinksService))
    private apDeathlinksService: ApDeathlinksService,
    private readonly client: Client,
  ) {}

  public async increaseDeathlinkCount(
    event: ApEvent,
    slot: string,
    timestamp: number,
    cause?: string,
  ): Promise<void> {
    const game = await this.apGamesService.findOne({
      slot,
      event,
    });

    if (game === null) {
      if (event.logChannelId) {
        const channel = await this.client.channels.fetch(event.logChannelId);
        if (channel?.isTextBased()) {
          await (channel as TextChannel).send({
            embeds: [
              new EmbedBuilder()
                .setColor(0xb51705)
                .setTitle('Deathlink Error')
                .setDescription('Jeu non identifié')
                .addFields({ name: 'Slot', value: slot })
                .addFields({ name: 'Cause', value: cause ?? '' })
                .setTimestamp(timestamp),
            ],
          });
        }
      }
      return;
    }

    const apDeathlink = new ApDeathlink();
    apDeathlink.game = game;
    apDeathlink.timestamp = new Date(timestamp);
    apDeathlink.cause = cause;
    apDeathlink.killCount =
      await this.apSessionsService.countDeathlinkKillcount(event.id);
    await this.apDeathlinksService.create(apDeathlink);
  }
}
