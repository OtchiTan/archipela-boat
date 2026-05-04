import { Inject, Injectable, Logger } from '@nestjs/common';
import { Context, SlashCommand, type SlashCommandContext } from 'necord';
import { ApEventsService } from 'src/ap-events/ap-events.service';
import { DiscordError } from 'src/core/discord.error';

@Injectable()
export class CloseApCommand {
  private logger: Logger = new Logger('UnregisterCommand');
  constructor(@Inject() private apEventsService: ApEventsService) {}

  @SlashCommand({
    name: 'close-ap',
    description: "Stop l'archipelago",
    defaultMemberPermissions: 'Administrator',
  })
  public async onStopAp(@Context() [interaction]: SlashCommandContext) {
    try {
      await this.apEventsService.stopAp(interaction.channelId);

      return await interaction.reply({
        flags: 'Ephemeral',
        content: "L'êvenement est bien stoppé",
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
