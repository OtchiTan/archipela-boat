import { forwardRef, Inject, Injectable } from '@nestjs/common';
import {
  Context,
  Options,
  SlashCommand,
  type SlashCommandContext,
} from 'necord';
import { ApEventsService } from 'src/ap-events/ap-events.service';
import { ApGamesService } from 'src/ap-games/ap-games.service';
import { IsNull, Not } from 'typeorm';
import { PingDto } from './dto/ping.dto';

@Injectable()
export class PingCommand {
  constructor(
    @Inject(forwardRef(() => ApEventsService))
    private apEventsService: ApEventsService,
    @Inject(forwardRef(() => ApGamesService))
    private apGamesService: ApGamesService,
  ) {}

  @SlashCommand({
    name: 'ping',
    description: 'Ping le joueur lié à un slot',
  })
  public async onPing(
    @Context() [interaction]: SlashCommandContext,
    @Options() options: PingDto,
  ) {
    if (interaction.guildId === null) {
      return await interaction.reply({
        flags: 'Ephemeral',
        content: 'Cette commande doit être executé sur un serveur discord',
      });
    }

    const apEvent = await this.apEventsService.findEvent({
      guildId: interaction.guildId,
      startTime: Not(IsNull()),
      endTime: IsNull(),
    });

    if (apEvent === null) {
      return await interaction.reply({
        flags: 'Ephemeral',
        content: "Aucun event n'est démarré sur ce serveur discord",
      });
    }

    const apGame = await this.apGamesService.findOne({
      slot: options.slot,
      event: apEvent,
    });

    if (apGame === null) {
      return await interaction.reply({
        flags: 'Ephemeral',
        content: "Aucun joueur n'est trouvé avec ce slot",
      });
    }

    return await interaction.reply(
      `Le joueur correspondant au slot ${options.slot} n'est autre que <@${apGame.player.discord_id}>`,
    );
  }
}
