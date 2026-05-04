import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Channel, Client, EmbedBuilder } from 'discord.js';
import { ApGamesService } from 'src/ap-games/ap-games.service';
import { ApPlayersService } from 'src/ap-players/ap-players.service';
import { DiscordError } from 'src/core/discord.error';
import { ApEvent } from '../ap-events.entity';

@Injectable()
export class UpdateEmbedsUseCase {
  constructor(
    @Inject(forwardRef(() => ApPlayersService))
    private apPlayersService: ApPlayersService,
    @Inject(forwardRef(() => ApGamesService))
    private apGamesService: ApGamesService,
    private readonly client: Client,
  ) {}

  public async updateMessageEmbeds(event: ApEvent) {
    let channel: Channel | null;
    try {
      channel = await this.client.channels.fetch(event.channelId);
    } catch {
      console.error("Le client discord JS n'est pas prêt");
      return;
    }

    if (!channel || !channel.isTextBased()) {
      throw new DiscordError("Le channel n'est pas valide");
    }

    const message = await channel.messages.fetch(event.messageId!);

    if (message) {
      const firstEmbed = EmbedBuilder.from(message.embeds[0]);

      const playerCount = await this.apPlayersService.countPlayers(event.id);
      const gameCount = await this.apGamesService.countGames(event.id);

      let description = `👥 ${playerCount} joueur·ses - 🎮 ${gameCount} jeux`;
      if (event.startTime && event.url && !event.endTime) {
        description = description.concat(
          `\nL'événement est démarré ! L'adresse est la suivante : ${event.url}`,
        );
      }
      firstEmbed.setDescription(description);
      firstEmbed.setFields([]);
      let color = 0x4287f5;
      if (event.startTime) {
        color = event.clientConnected ? 0x0bbd11 : 0xb51705;
      }
      if (event.endTime) {
        color = 0xebb821;
      }
      firstEmbed.setColor(color);

      const embeds = new Array<EmbedBuilder>(firstEmbed);

      const players = await this.apPlayersService.findAll({ event });

      let embedId = 0;
      let fieldCount = 0;

      for (const player of players) {
        const lines = new Array<string>();
        for (const game of player.games) {
          let apWorld = '';
          if (game.isCoreGame) {
            apWorld = 'Core Game ⚙️';
          } else {
            apWorld = game.apworld
              ? `[Apworld](${process.env.APP_URL}/ap-games/${game.id}/apworld) ✅`
              : 'Apworld :x:';
          }

          lines.push(
            `${game.name} - [YAML](${process.env.APP_URL}/ap-games/${game.id}/yaml) ✅ - ${apWorld}`,
          );
        }
        embeds[embedId].addFields({
          name: player.username,
          value: lines.join('\n'),
        });
        fieldCount++;
        if (fieldCount >= 25) {
          embedId++;
          fieldCount = 0;
          const nextEmbed = new EmbedBuilder()
            .setDescription(description)
            .setColor(color);
          embeds.push(nextEmbed);
        }
      }

      await message.edit({ embeds });
    }
  }
}
