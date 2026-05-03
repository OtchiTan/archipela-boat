import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Context, SlashCommand, type SlashCommandContext } from 'necord';
import { ApEventsService } from 'src/ap-events/ap-events.service';

@Injectable()
export class GetFilesCommand {
  constructor(
    @Inject(forwardRef(() => ApEventsService))
    private apEventsService: ApEventsService,
  ) {}

  @SlashCommand({
    name: 'get-files',
    description: "Obtiens les fichiers pour l'event",
    defaultMemberPermissions: 'Administrator',
  })
  public async onUnregister(@Context() [interaction]: SlashCommandContext) {
    const event = await this.apEventsService.findEvent({
      channelId: interaction.channelId,
    });

    if (!event) {
      return await interaction.reply({
        flags: 'Ephemeral',
        content: "Aucun n'event n'est démarré dans ce channel",
      });
    }

    return await interaction.reply({
      flags: 'Ephemeral',
      content: `Voici votre [fichier](${process.env.APP_URL}/ap-events/${event.id}/files) pour l'êvenement`,
    });
  }
}
