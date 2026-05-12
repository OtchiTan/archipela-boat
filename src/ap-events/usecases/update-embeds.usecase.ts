import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Channel, Client, EmbedBuilder, TextChannel } from 'discord.js';
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

    const messages = await channel.messages.fetch();

    for (const [, message] of messages) {
      if (message.author.bot) {
        message.delete();
      }
    }

    const playerCount = await this.apPlayersService.countPlayers(event.id);
    const gameCount = await this.apGamesService.countGames(event.id);

    const embeds = new Array<EmbedBuilder>(
      this.createEmbed(event, playerCount, gameCount),
    );

    const players = await this.apPlayersService.findAll({ event });

    let embedId = 0;
    let fieldCount = 0;

    for (const player of players) {
      fieldCount++;
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

      const fieldText = lines.join('\n');

      if (
        embeds[embedId].length + fieldText.length >= 6000 ||
        fieldCount >= 25
      ) {
        embedId++;
        fieldCount = 0;
        embeds.push(this.createEmbed(event, playerCount, gameCount));
      }

      embeds[embedId].addFields({
        name: player.username,
        value: fieldText,
      });
    }

    for (const embed of embeds) {
      if (channel.isTextBased()) {
        (channel as TextChannel).send({ embeds: [embed] });
      }
    }
  }

  createEmbed(
    event: ApEvent,
    playerCount: number,
    gameCount: number,
  ): EmbedBuilder {
    let description = `👥 ${playerCount} joueur·ses - 🎮 ${gameCount} jeux`;
    if (event.startTime && event.url && !event.endTime) {
      description = description.concat(
        `\nL'événement est démarré ! L'adresse est la suivante : ${event.url}`,
      );
    }
    let color = 0x4287f5;
    if (event.startTime) {
      color = event.clientConnected ? 0x0bbd11 : 0xb51705;
    }
    if (event.endTime) {
      color = 0xebb821;
    }
    return new EmbedBuilder()
      .setDescription(description)
      .setColor(color)
      .setTitle(`🏝️ ${event.name} 🏝️`)
      .setTimestamp(new Date());
  }
}
