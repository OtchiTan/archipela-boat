import { Inject, Injectable } from '@nestjs/common';
import {
  Context,
  Options,
  SlashCommand,
  type SlashCommandContext,
} from 'necord';
import { ApEventsService } from 'src/ap-events/ap-events.service';
import { StartApDto } from './dto/start-ap.dto';

@Injectable()
export class StartApCommand {
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
      if (error instanceof Error) {
        return await interaction.reply({
          flags: 'Ephemeral',
          content: error.message,
        });
      }
    }
  }
}
