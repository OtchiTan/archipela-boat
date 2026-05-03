import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import {
  Context,
  Options,
  SlashCommand,
  type SlashCommandContext,
} from 'necord';
import { ApGamesService } from 'src/ap-games/ap-games.service';
import { DiscordError } from 'src/core/discord.error';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class RegisterCommand {
  private logger: Logger = new Logger('UnregisterCommand');
  constructor(
    @Inject(forwardRef(() => ApGamesService))
    private apGamesService: ApGamesService,
  ) {}

  @SlashCommand({
    name: 'register',
    description: 'Enregistre tes mondes pour le prochain archipelago',
  })
  public async onRegister(
    @Context() [interaction]: SlashCommandContext,
    @Options() registerDto: RegisterDto,
  ) {
    try {
      await this.apGamesService.registerGame(
        registerDto,
        interaction.channelId,
        interaction.user.id,
        interaction.user.displayName,
      );
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

    return await interaction.reply({
      flags: 'Ephemeral',
      content: 'Fichier bien enregistré',
    });
  }
}
