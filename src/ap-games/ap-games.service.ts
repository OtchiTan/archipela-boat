import { HttpService } from '@nestjs/axios';
import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  StreamableFile,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { APIEmbed, EmbedBuilder, JSONEncodable, Message } from 'discord.js';
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  writeFileSync,
} from 'fs';
import { IncomingMessage } from 'http';
import { type SlashCommandContext } from 'necord';
import { basename, join } from 'path';
import { ApDeathlink } from 'src/ap-deathlinks/ap-deathlinks.entity';
import { ApDeathlinksService } from 'src/ap-deathlinks/ap-deathlinks.service';
import { ApEvent } from 'src/ap-events/ap-events.entity';
import { ApEventsService } from 'src/ap-events/ap-events.service';
import { ApPlayer } from 'src/ap-players/ap-players.entity';
import { ApPlayersService } from 'src/ap-players/ap-players.service';
import { RegisterDto } from 'src/commands/dto/register.dto';
import { EntityNotFoundError, Repository } from 'typeorm';
import { parse as yamlParse, stringify as yamlStringify } from 'yaml';
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
    @Inject(forwardRef(() => ApDeathlinksService))
    private apDeathlinksService: ApDeathlinksService,
    private readonly httpService: HttpService,
  ) {}

  async findOne(game: Partial<ApGame>): Promise<ApGame> {
    const foundedGame = await this.apGameRepository.findOne({
      where: { ...game, event: { id: game.event?.id } },
      relations: { event: true, player: true },
    });
    if (!foundedGame) {
      throw new EntityNotFoundError(ApGame, game);
    }
    return foundedGame;
  }

  async getYamlFile(id: number): Promise<StreamableFile> {
    const apGame = await this.findOne({ id });

    const folderPath = join(process.cwd(), '.tmp', 'yaml');
    const filePath = join(folderPath, `${apGame.name}.yaml`);
    if (!existsSync(folderPath)) {
      mkdirSync(folderPath, { recursive: true });
    }

    const fileData = JSON.parse(apGame.yaml) as Record<string, any>;
    fileData.name = apGame.slot;

    const yamlData = yamlStringify(fileData);

    writeFileSync(filePath, yamlData);

    const file = createReadStream(filePath);

    return new StreamableFile(file, {
      type: 'application/yaml',
      disposition: `attachment; filename="${basename(filePath)}"`,
    });
  }

  async getApWorldFile(id: number): Promise<StreamableFile> {
    const apGame = await this.findOne({ id });

    if (apGame.apworld === undefined) {
      throw new HttpException('NotFound', HttpStatus.NOT_FOUND);
    }

    const file = createReadStream(apGame.apworld);

    return new StreamableFile(file, {
      type: 'application/apworld',
      disposition: `attachment; filename="${basename(apGame.apworld)}"`,
    });
  }

  async create(game: Partial<ApGame>): Promise<ApGame> {
    const createGame = await this.apGameRepository.save(game);
    return this.findOne({ id: createGame.id });
  }

  async update(id: number, game: Partial<ApGame>): Promise<ApGame> {
    await this.apGameRepository.update(id, game);
    return await this.findOne({ id });
  }

  public async increaseDeathlinkCount(
    event: ApEvent,
    slot: string,
    timestamp: number,
    cause?: string,
  ): Promise<void> {
    const game = await this.findOne({
      slot,
      event,
    });
    const apDeathlink = new ApDeathlink();
    apDeathlink.game = game;
    apDeathlink.timestamp = new Date(timestamp);
    apDeathlink.cause = cause;
    await this.apDeathlinksService.create(apDeathlink);
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

    let apWorldFilePath: string | undefined;
    if (registerDto.apworld) {
      try {
        const folderPath = join(process.cwd(), '.tmp', 'yaml');
        apWorldFilePath = join(folderPath, registerDto.apworld.name);
        if (!existsSync(folderPath)) {
          mkdirSync(folderPath, { recursive: true });
        }

        const writer = createWriteStream(apWorldFilePath);

        const response = await this.httpService.axiosRef.get<IncomingMessage>(
          registerDto.apworld.url,
          { responseType: 'stream' },
        );

        response.data.pipe(writer);
      } catch {
        return interaction.reply({
          content: 'Impossible de récupérer le fichier apworld',
          flags: 'Ephemeral',
        });
      }
    }

    let apPlayer = new ApPlayer();
    try {
      apPlayer = await this.apPlayersService.findOne({
        event,
        discord_id: userId,
      });
    } catch {
      apPlayer.event = event;
      apPlayer.discord_id = userId;
      apPlayer = await this.apPlayersService.create(apPlayer);
    }

    let apGame = new ApGame();
    try {
      apGame = await this.findOne({
        player: apPlayer,
        event,
        name: yamlData.game,
        slot: yamlData.name,
      });

      apGame.yaml = JSON.stringify(yamlData);
      apGame.apworld = apWorldFilePath;
    } catch {
      apGame.player = apPlayer;
      apGame.event = event;
      apGame.name = yamlData.game;
      apGame.slot = yamlData.name;
      apGame.yaml = JSON.stringify(yamlData);
      apGame.apworld = apWorldFilePath;

      apGame = await this.create(apGame);
    }

    const message = await interaction.channel?.messages.fetch(event.messageId!);

    if (message) {
      const [newEmbed, embedId] = this.getEmbed(apPlayer.embedId, message);

      const fieldId = this.getFieldNextId(apPlayer.fieldId, newEmbed);

      const fields = newEmbed.data.fields ?? [];

      if (fields.length <= fieldId) {
        fields.push({ name: '', value: '' });
      }

      fields[fieldId].name = userDisplayName;

      const lines = fields[fieldId].value.split('\n');

      const lineId = this.getLineNextId(apGame.lineId, yamlData.name, lines);

      if (lines.length <= lineId) {
        lines.push('');
      }

      const apWorld = registerDto.apworld
        ? `[Apworld](${process.env.APP_URL}/ap-games/${apGame.id}/apworld) ✅`
        : 'Apworld :x:';

      lines[lineId] =
        `${yamlData.game} - [YAML](${process.env.APP_URL}/ap-games/${apGame.id}/yaml) ✅ - ${apWorld}`;

      fields[fieldId].value = lines.join('\n');

      newEmbed.setFields(fields);

      const embeds = message.embeds as JSONEncodable<APIEmbed>[];
      embeds[embedId] = newEmbed;

      const firstEmbed = EmbedBuilder.from(embeds[0]);

      const playerCount = await this.apPlayersService.countPlayers(event.id);

      firstEmbed.setDescription(
        `:busts_in_silhouette: ${playerCount} personne inscrite`,
      );

      embeds[0] = firstEmbed;

      await message.edit({ embeds });

      apPlayer.embedId = embedId;
      apPlayer.fieldId = fieldId;
      apGame.lineId = lineId;
    }

    await this.apPlayersService.update(apPlayer.id, apPlayer);
    await this.update(apGame.id, apGame);

    return interaction.reply({
      content: 'Fichiers bien enregisté',
      flags: 'Ephemeral',
    });
  }

  getEmbed(embedId: number, message: Message<boolean>): [EmbedBuilder, number] {
    if (embedId !== -1) {
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
    if (fieldId !== -1) {
      return fieldId;
    }

    return embed.data.fields?.length ?? 0;
  }

  getLineNextId(lineId: number, game: string, lines: string[]): number {
    if (lineId !== -1) {
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
