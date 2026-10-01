import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Context, SlashCommand, type SlashCommandContext } from 'necord';
import { ApEventsService } from 'src/ap-events/ap-events.service';
import { ApSessionsService } from 'src/ap-sessions/ap-sessions.service';
import { IsNull, Not } from 'typeorm';

@Injectable()
export class DeathlinkCommand {
  constructor(
    @Inject(forwardRef(() => ApEventsService))
    private apEventsService: ApEventsService,
    @Inject(forwardRef(() => ApSessionsService))
    private apSessionsService: ApSessionsService,
  ) {}

  @SlashCommand({
    name: 'deathlink',
    description:
      'Compte le nombre de personne jouant actuellement avec le deathlink',
  })
  public async onPing(@Context() [interaction]: SlashCommandContext) {
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

    if (!apEvent) {
      return await interaction.reply({
        flags: 'Ephemeral',
        content: "Aucun événement n'est lié à ce channel",
      });
    }

    const deahtlinkCount = await this.apSessionsService.countDeathlinkKillcount(
      apEvent.id,
    );

    return await interaction.reply({
      content: `Il y a actuellement ${deahtlinkCount} joueur·euse avec le deathlink activé`,
    });
  }
}
