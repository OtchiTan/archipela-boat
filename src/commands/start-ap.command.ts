import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  Context,
  Options,
  SlashCommand,
  type SlashCommandContext,
} from 'necord';
import { ApEventsService } from 'src/ap-events/ap-events.service';
import { DiscordError } from 'src/core/discord.error';
import { StartApDto } from './dto/start-ap.dto';

@Injectable()
export class StartApCommand {
  private logger: Logger = new Logger('UnregisterCommand');
  constructor(@Inject() private apEventsService: ApEventsService) {}

  @SlashCommand({
    name: 'start-ap',
    description: "Démarre l'archipelago",
    defaultMemberPermissions: 'Administrator',
  })
  public async onRegister(
    @Context() [interaction]: SlashCommandContext,
    @Options() startApDto: StartApDto,
  ) {
    try {
      await this.apEventsService.startAp(startApDto);

      return await interaction.reply({
        flags: 'Ephemeral',
        content: "L'êvenement à démarré",
      });
    } catch (error) {
      if (error instanceof DiscordError) {
        return await interaction.reply({
          flags: 'Ephemeral',
          content: error.message,
        });
      }
      this.logger.error(error);
    }
  }
}
