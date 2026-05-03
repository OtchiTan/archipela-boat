import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import {
  Context,
  Options,
  SlashCommand,
  type SlashCommandContext,
} from 'necord';
import { ApGamesService } from 'src/ap-games/ap-games.service';
import { DiscordError } from 'src/core/discord.error';
import { RegisterAdminDto } from './dto/register-admin.dto';

@Injectable()
export class RegisterAdminCommand {
  private logger: Logger = new Logger('UnregisterCommand');
  constructor(
    @Inject(forwardRef(() => ApGamesService))
    private apGamesService: ApGamesService,
  ) {}

  @SlashCommand({
    name: 'register-admin',
    description: 'Enregistre tes mondes pour le prochain archipelago',
    defaultMemberPermissions: 'Administrator',
  })
  public async onRegister(
    @Context() [interaction]: SlashCommandContext,
    @Options() registerDto: RegisterAdminDto,
  ) {
    try {
      await this.apGamesService.registerGame(
        registerDto,
        interaction.channelId,
        registerDto.user.id,
        registerDto.user.displayName,
      );
    } catch (error) {
      if (error instanceof DiscordError) {
        return await interaction.reply({
          flags: 'Ephemeral',
          content: error.message,
        });
      }
      this.logger.error(error);
    }

    return await interaction.reply({
      flags: 'Ephemeral',
      content: 'Fichier bien enregistré',
    });
  }
}
