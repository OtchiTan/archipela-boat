import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Client } from 'archipelago.js';
import { ColorResolvable, Colors, EmbedBuilder } from 'discord.js';
import {
  Context,
  Options,
  SlashCommand,
  type SlashCommandContext,
} from 'necord';
import { ApEvent } from 'src/ap-events/ap-events.entity';
import { ApEventsService } from 'src/ap-events/ap-events.service';
import { ApGame } from 'src/ap-games/ap-games.entity';
import { ApGamesService } from 'src/ap-games/ap-games.service';
import { In, IsNull, Not } from 'typeorm';
import { HintsDto } from './dto/hints.dto';

@Injectable()
export class HintsCommand {
  constructor(
    @Inject(forwardRef(() => ApEventsService))
    private apEventsService: ApEventsService,
    @Inject(forwardRef(() => ApGamesService))
    private apGamesService: ApGamesService,
  ) {}

  @SlashCommand({
    name: 'hints',
    description:
      'Récupère la liste des checks important restants lié à un slots',
  })
  public async onHints(
    @Context() [interaction]: SlashCommandContext,
    @Options() hintsDto: HintsDto,
  ) {
    if (interaction.guildId === null) {
      return await interaction.reply({
        flags: 'Ephemeral',
        content: 'Cette commande doit être executé sur un serveur discord',
      });
    }

    const apEvent = await this.apEventsService.findEvent({
      guildId: interaction.guildId,
      startTime: Not(IsNull()),
      endTime: IsNull(),
    });

    if (apEvent === null) {
      return await interaction.reply({
        flags: 'Ephemeral',
        content: "Aucun event n'est démarré sur ce serveur discord",
      });
    }

    await interaction.deferReply({});

    if (hintsDto.slot !== null) {
      const apGame = await this.apGamesService.findOne({
        event: apEvent,
        slot: hintsDto.slot,
      });

      if (apGame === null) {
        return await interaction.reply({
          flags: 'Ephemeral',
          content: 'Aucun jeu trouvé pour ce slot',
        });
      }

      await this.manageSlot([interaction], apEvent, apGame);
    } else {
      const games = await this.apGamesService.findAll({
        event: { id: apEvent.id },
        player: { discord_id: interaction.user.id },
      });

      for (const game of games) {
        await this.manageSlot([interaction], apEvent, game);
      }
    }
  }

  async manageSlot(
    [interaction]: SlashCommandContext,
    apEvent: ApEvent,
    apGame: ApGame,
  ) {
    const client = new Client();
    try {
      await client.login(apEvent.url ?? '', apGame.slot, '', {
        tags: ['Tracker'],
      });

      const player = client.players.teams
        .flat()
        .find((connectedPlayer) => connectedPlayer.name === apGame.slot);

      if (player === undefined) {
        return await interaction.editReply({
          content: `Le slot ${apGame.slot} n'a pas été trouvé sur le serveur Archipelago`,
        });
      }

      const hints = (await player.fetchHints()).filter(
        (hint) => hint.status === 30,
      );
      if (hints.length === 0) {
        return await interaction.editReply({
          content: `Aucun hint restant pour le slot ${apGame.slot}`,
        });
      }

      const slots = hints.map((hint) => hint.item.sender.name);
      slots.concat(hints.map((hint) => hint.item.sender.name));

      const games = await this.apGamesService.findAll({
        event: { id: apEvent.id },
        slot: In(slots),
      });

      const randomColorKey = Object.keys(Colors);
      const color = Colors[
        randomColorKey[(randomColorKey.length * Math.random()) << 0]
      ] as ColorResolvable;

      const yourHints = hints.filter(
        (hint) => hint.item.sender.name === apGame.slot,
      );

      const yourHintsEmbed = new EmbedBuilder()
        .setTitle(`Vos hints pour ${apGame.slot} - ${apGame.name}`)
        .setColor(color)
        .setDescription('Voici la liste des hints que vous avez demandé')
        .setTimestamp(new Date());

      for (const hint of yourHints) {
        const discordId = games.find(
          (game) => hint.item.sender.name === game.slot,
        )?.player.discord_id;
        yourHintsEmbed.addFields({
          name: `${hint.item.locationGame} - ${hint.item.locationName}`,
          value: discordId ? `<@${discordId}>` : `${hint.item.sender.name}`,
        });
      }

      const theirHints = hints.filter(
        (hint) => hint.item.sender.name !== apGame.slot,
      );

      const theirHintsEmbed = new EmbedBuilder()
        .setTitle(`Les hints des autres dans ${apGame.slot} - ${apGame.name}`)
        .setColor(color)
        .setDescription("Voici la liste des hints qu'ont vous as demandé")
        .setTimestamp(new Date());

      for (const hint of theirHints) {
        const discordId = games.find(
          (game) => hint.item.receiver.name === game.slot,
        )?.player.discord_id;
        theirHintsEmbed.addFields({
          name: `${hint.item.locationGame} - ${hint.item.locationName}`,
          value: discordId ? `<@${discordId}>` : `${hint.item.receiver.name}`,
        });
      }

      await interaction.followUp({
        embeds: [yourHintsEmbed, theirHintsEmbed],
      });
    } catch (error) {
      console.error(error);
      return await interaction.editReply({
        content:
          'Impossible de récupérer les hints depuis le serveur Archipelago',
      });
    } finally {
      client.socket.disconnect();
    }
  }
}
