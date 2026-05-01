import { forwardRef, Inject, Injectable } from '@nestjs/common';
import {
  Context,
  Options,
  SlashCommand,
  type SlashCommandContext,
} from 'necord';
import { ApGamesService } from 'src/ap-games/ap-games.service';
import { RegisterAdminDto } from './dto/register-admin.dto';

@Injectable()
export class RegisterAdminCommand {
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
      if (error instanceof Error) {
        return await interaction.reply({
          flags: 'Ephemeral',
          content: error.message,
        });
      }
    }

    return await interaction.reply({
      flags: 'Ephemeral',
      content: 'Fichier bien enregistré',
    });
  }
}
