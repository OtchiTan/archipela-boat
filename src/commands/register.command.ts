import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { APIEmbed, EmbedBuilder, JSONEncodable, Message } from 'discord.js';
import {
  Context,
  Options,
  SlashCommand,
  type SlashCommandContext,
} from 'necord';
import { ApEventsService } from 'src/ap-events/ap-events.service';
import { ApGame } from 'src/ap-games/ap-games.entity';
import { ApGamesService } from 'src/ap-games/ap-games.service';
import { ApPlayer } from 'src/ap-players/ap-players.entity';
import { ApPlayersService } from 'src/ap-players/ap-players.service';
import { parse as yamlParse } from 'yaml';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class RegisterCommand {
  constructor(
    @Inject() private apPlayersService: ApPlayersService,
    @Inject() private apEventsService: ApEventsService,
    @Inject() private apGamesService: ApGamesService,
    private readonly httpService: HttpService,
  ) {}

  @SlashCommand({
    name: 'register',
    description: 'Enregistre tes mondes pour le prochain archipelago',
  })
  public async onRegister(
    @Context() [interaction]: SlashCommandContext,
    @Options() registerDto: RegisterDto,
  ) {
    // Check if file is a yaml file
    if (!registerDto.yaml.name.endsWith('.yaml')) {
      return interaction.reply({
        content:
          "Le fichier fourni n'est pas un fichier yaml. Veuillez fournir un fichier yaml.",
        ephemeral: true,
      });
    }

    // Check if apworld file is provided and if it is a apworld file
    if (registerDto.apworld && !registerDto.apworld.name.endsWith('.apworld')) {
      return interaction.reply({
        content:
          "Le fichier apworld fourni n'est pas un fichier apworld. Veuillez fournir un fichier .apworld valide.",
        ephemeral: true,
      });
    }

    const event = await this.apEventsService.findEvent({
      channelId: interaction.channelId,
    });

    let yamlData: Record<string, string>;

    try {
      const { data } = await this.httpService.axiosRef.get<string>(
        registerDto.yaml.url,
      );

      yamlData = yamlParse(data) as Record<string, string>;
    } catch {
      return interaction.reply({
        content: 'Impossible de récupérer le fichier yaml',
        flags: 'Ephemeral',
      });
    }

    let apPlayer: ApPlayer;
    let isPlayerExisting = false;
    try {
      apPlayer = await this.apPlayersService.findOne({
        event: event,
        discord_id: interaction.user.id,
      });

      apPlayer.apworld = registerDto.apworld?.url;
      apPlayer.yaml = JSON.stringify(yamlData);

      isPlayerExisting = true;
    } catch {
      apPlayer = new ApPlayer();
      apPlayer.discord_id = interaction.user.id;
      apPlayer.yaml = JSON.stringify(yamlData);
      apPlayer.apworld = registerDto.apworld?.url;
      apPlayer.event = event;
    }

    let apGame: ApGame;
    let isGameExisting = false;
    try {
      apGame = await this.apGamesService.findOne({
        player: apPlayer,
        event,
        name: yamlData.game,
        slot: yamlData.name,
      });

      isGameExisting = true;
    } catch {
      apGame = new ApGame();
      apGame.name = yamlData.game;
      apGame.slot = yamlData.name;
      apGame.event = event;
    }

    const message = await interaction.channel?.messages.fetch(event.messageId!);

    if (message) {
      const [newEmbed, embedId] = this.getEmbed(apPlayer.embedId, message);

      const fieldId = this.getFieldNextId(apPlayer.fieldId, newEmbed);

      const fields = newEmbed.data.fields ?? [];

      if (fields.length <= fieldId) {
        fields.push({ name: '', value: '' });
      }

      fields[fieldId].name = interaction.user.displayName;

      const apWorldIcon = registerDto.apworld ? ':white_check_mark:' : ':x:';

      const lines = fields[fieldId].value.split('\n');

      const lineId = this.getLineNextId(apGame.lineId, yamlData.name, lines);

      if (lines.length <= lineId) {
        lines.push('');
      }

      lines[lineId] =
        `${yamlData.game} - YAML :white_check_mark: - Apworld ${apWorldIcon}`;

      fields[fieldId].value = lines.join('\n');

      newEmbed.setFields(fields);

      const embeds = message.embeds as JSONEncodable<APIEmbed>[];
      embeds[embedId] = newEmbed;

      await message.edit({ embeds });

      apPlayer.embedId = embedId;
      apPlayer.fieldId = fieldId;
      apGame.lineId = lineId;
    }

    if (isPlayerExisting) {
      apPlayer = await this.apPlayersService.update(apPlayer.id, apPlayer);
    } else {
      apPlayer = await this.apPlayersService.create(apPlayer);
    }

    apGame.player = apPlayer;
    if (isGameExisting) {
      await this.apGamesService.update(apGame.id, apGame);
    } else {
      await this.apGamesService.create(apGame);
    }

    return interaction.reply({
      content: 'Fichiers bien enregisté',
      flags: 'Ephemeral',
    });
  }

  getEmbed(embedId: number, message: Message<boolean>): [EmbedBuilder, number] {
    if (embedId != -1) {
      return [EmbedBuilder.from(message.embeds[embedId]), embedId];
    }

    let id = 0;
    for (const embed of message.embeds) {
      if (embed.fields.length < 25) {
        return [EmbedBuilder.from(message.embeds[id]), id];
      }
      id++;
    }

    return [new EmbedBuilder(), id];
  }

  getFieldNextId(fieldId: number, embed: EmbedBuilder): number {
    if (fieldId != -1) {
      return fieldId;
    }

    return embed.data.fields?.length ?? 0;
  }

  getLineNextId(lineId: number, game: string, lines: string[]): number {
    if (lineId != -1) {
      return lineId;
    }

    let id = 0;
    for (const line of lines) {
      if (line.startsWith(game)) {
        return id;
      }
      id++;
    }

    return id;
  }
}
