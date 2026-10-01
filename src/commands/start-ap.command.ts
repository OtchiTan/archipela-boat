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
  private logger: Logger = new Logger('StartApCommand');
  constructor(@Inject() private apEventsService: ApEventsService) {}

  @SlashCommand({
    name: 'start-ap',
    description: "Démarre l'archipelago",
    defaultMemberPermissions: 'Administrator',
  })
  public async onStartAp(
    @Context() [interaction]: SlashCommandContext,
    @Options() startApDto: StartApDto,
  ) {
    try {
      await interaction.deferReply({ flags: 'Ephemeral' });
    } catch (error) {
      this.logger.error(error);
      return;
    }

    let content: string;
    try {
      await this.apEventsService.startAp(interaction.channelId, startApDto);
      content = "L'événement a démarré";
    } catch (error) {
      if (error instanceof DiscordError) {
        content = error.message;
      } else {
        this.logger.error(error);
        content = 'Euh... cpt';
      }
    }

    try {
      return await interaction.editReply({ content });
    } catch (error) {
      this.logger.error(error);
    }
  }
}
