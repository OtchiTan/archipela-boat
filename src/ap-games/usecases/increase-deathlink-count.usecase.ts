import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Client, EmbedBuilder, TextChannel, User } from 'discord.js';
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

    const apDeathlink = new ApDeathlink();
    apDeathlink.game = game ?? undefined;
    apDeathlink.timestamp = new Date(timestamp);
    apDeathlink.cause = cause;
    apDeathlink.slot = slot;
    apDeathlink.event = event;
    apDeathlink.killCount =
      await this.apSessionsService.countDeathlinkKillcount(event.id);
    await this.apDeathlinksService.create(apDeathlink);

    if (event.logChannelId) {
      const channel = await this.client.channels.fetch(event.logChannelId);

      let user: User | null = null;
      try {
        user = await this.client.users.fetch(game?.player.discord_id ?? '');
      } catch (error) {
        console.error(error);
      }

      const embed = new EmbedBuilder()
        .setColor(0x0bbd11)
        .setTitle('Nouveau Deathlink !')
        .addFields({
          name: 'Jeu',
          value: game?.name ?? 'Jeu non identifié',
        })
        .addFields({ name: 'Slot', value: slot })
        .addFields({
          name: 'Killcount',
          value: `${apDeathlink.killCount} kill${apDeathlink.killCount > 1 ? 's' : ''}`,
        })
        .setTimestamp(timestamp);

      if (cause) {
        embed.addFields({ name: 'Cause', value: cause });
      }

      if (user !== null) {
        embed.setAuthor({
          name: user.displayName,
          iconURL: user.avatarURL() ?? undefined,
        });
      }

      await (channel as TextChannel).send({
        embeds: [embed],
      });
    }
  }
}
