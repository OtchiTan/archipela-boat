import { Inject, Injectable, Logger } from '@nestjs/common';
import { Context, SlashCommand, type SlashCommandContext } from 'necord';
import { ApEventsService } from 'src/ap-events/ap-events.service';
import { DiscordError } from 'src/core/discord.error';
import { IsNull } from 'typeorm';

@Injectable()
export class UpdateMessageCommand {
  private logger: Logger = new Logger('UnregisterCommand');
  constructor(@Inject() private apEventsService: ApEventsService) {}

  @SlashCommand({
    name: 'update-message',
    description: "Force la mise à jour du message d'event",
    defaultMemberPermissions: 'Administrator',
  })
  public async onStopAp(@Context() [interaction]: SlashCommandContext) {
    try {
      const event = await this.apEventsService.findEvent({
        channelId: interaction.channelId,
        endTime: IsNull(),
      });

      if (event === null) {
        return await interaction.reply({
          flags: 'Ephemeral',
          content: "Il n'y à pas d'événement en cours dans ce channel",
        });
      }

      await this.apEventsService.updateEmbeds(event);

      return await interaction.reply({
        flags: 'Ephemeral',
        content: 'Le message à bien été mis à jour',
      });
    } catch (error) {
      if (error instanceof DiscordError) {
        return await interaction.reply({
          flags: 'Ephemeral',
          content: error.message,
        });
      }
      this.logger.error(error);
      return await interaction.reply({
        flags: 'Ephemeral',
        content: 'Euh... cpt',
      });
    }
  }
}
