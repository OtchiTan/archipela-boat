import { HttpService } from '@nestjs/axios';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { APIEmbed, EmbedBuilder, JSONEncodable, Message } from 'discord.js';
import { type SlashCommandContext } from 'necord';
import { ApEvent } from 'src/ap-events/ap-events.entity';
import { ApEventsService } from 'src/ap-events/ap-events.service';
import { ApPlayer } from 'src/ap-players/ap-players.entity';
import { ApPlayersService } from 'src/ap-players/ap-players.service';
import { RegisterDto } from 'src/commands/dto/register.dto';
import { EntityNotFoundError, Repository } from 'typeorm';
import { parse as yamlParse } from 'yaml';
import { ApGame } from './ap-games.entity';

@Injectable()
export class ApGamesService {
  constructor(
    @InjectRepository(ApGame)
    private apGameRepository: Repository<ApGame>,
    @Inject(forwardRef(() => ApPlayersService))
    private apPlayersService: ApPlayersService,
    @Inject(forwardRef(() => ApEventsService))
    private apEventsService: ApEventsService,
    private readonly httpService: HttpService,
  ) {}

  async findOne(game: Partial<ApGame>): Promise<ApGame> {
    const foundedGame = await this.apGameRepository.findOne({
      where: game,
      relations: { event: true, player: true },
    });
    if (!foundedGame) {
      throw new EntityNotFoundError(ApGame, game);
    }
    return foundedGame;
  }

  async create(game: Partial<ApGame>): Promise<ApGame> {
    return await this.apGameRepository.save(game);
  }

  async update(id: number, game: Partial<ApGame>): Promise<ApGame> {
    await this.apGameRepository.update(id, game);
    return await this.findOne({ id });
  }

  public async increaseDeathlinkCount(
    event: ApEvent,
    slot: string,
  ): Promise<void> {
    const game = await this.findOne({ slot, event });
    game.deathlinkCount += 1;
    await this.apGameRepository.save(game);
  }

  public async onRegister(
    [interaction]: SlashCommandContext,
    registerDto: RegisterDto,
    userId: string,
    userDisplayName: string,
  ) {
    // Check if file is a yaml file
    if (!registerDto.yaml.name.endsWith('.yaml')) {
      return interaction.reply({
        content:
          "Le fichier fourni n'est pas un fichier yaml. Veuillez fournir un fichier yaml.",
        flags: 'Ephemeral',
      });
    }

    // Check if apworld file is provided and if it is a apworld file
    if (registerDto.apworld && !registerDto.apworld.name.endsWith('.apworld')) {
      return interaction.reply({
        content:
          "Le fichier apworld fourni n'est pas un fichier apworld. Veuillez fournir un fichier .apworld valide.",
        flags: 'Ephemeral',
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
        discord_id: userId,
      });

      isPlayerExisting = true;
    } catch {
      apPlayer = new ApPlayer();
      apPlayer.discord_id = userId;
      apPlayer.event = event;
    }

    let apGame: ApGame;
    let isGameExisting = false;
    try {
      apGame = await this.findOne({
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

    apGame.yaml = JSON.stringify(yamlData);
    apGame.apworld = registerDto.apworld?.url;

    const message = await interaction.channel?.messages.fetch(event.messageId!);

    if (message) {
      const [newEmbed, embedId] = this.getEmbed(apPlayer.embedId, message);

      const fieldId = this.getFieldNextId(apPlayer.fieldId, newEmbed);

      const fields = newEmbed.data.fields ?? [];

      if (fields.length <= fieldId) {
        fields.push({ name: '', value: '' });
      }

      fields[fieldId].name = userDisplayName;

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

      const firstEmbed = EmbedBuilder.from(embeds[0]);
      let playerCount = await this.apPlayersService.countPlayers(event.id);
      if (!isPlayerExisting) {
        playerCount++;
      }
      firstEmbed.setDescription(
        `:busts_in_silhouette: ${playerCount} personne inscrite`,
      );

      embeds[0] = firstEmbed;

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
      await this.update(apGame.id, apGame);
    } else {
      await this.create(apGame);
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
