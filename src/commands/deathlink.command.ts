import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Context, SlashCommand, type SlashCommandContext } from 'necord';
import { ApEventsService } from 'src/ap-events/ap-events.service';
import { ApSessionsService } from 'src/ap-sessions/ap-sessions.service';

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
    const apEvent = await this.apEventsService.findEvent({
      logChannelId: interaction.channelId,
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
