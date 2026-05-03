import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import {
  Context,
  Options,
  SlashCommand,
  type SlashCommandContext,
} from 'necord';
import { ApGamesService } from 'src/ap-games/ap-games.service';
import { DiscordError } from 'src/core/discord.error';
import { UnregisterDto } from './dto/unregister.dto';

@Injectable()
export class UnregisterCommand {
  private logger: Logger = new Logger('UnregisterCommand');

  constructor(
    @Inject(forwardRef(() => ApGamesService))
    private apGamesService: ApGamesService,
  ) {}

  @SlashCommand({
    name: 'unregister',
    description: 'Supprime ton monde pour le prochain archipelago',
  })
  public async onUnregister(
    @Context() [interaction]: SlashCommandContext,
    @Options() unregisterDto: UnregisterDto,
  ) {
    const isAdmin = interaction.memberPermissions?.has('Administrator');
    try {
      await this.apGamesService.unregisterGame(
        unregisterDto,
        interaction.channelId,
        interaction.user.id,
        isAdmin === true,
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
      content: 'Jeu bien supprimé',
    });
  }
}
