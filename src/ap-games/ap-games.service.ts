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
import { EmbedBuilder } from 'discord.js';
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

      apPlayer.username = userDisplayName;
      await this.apPlayersService.update(apPlayer.id, apPlayer);
    } catch {
      apPlayer.event = event;
      apPlayer.discord_id = userId;
      apPlayer.username = userDisplayName;
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

      await this.update(apGame.id, apGame);
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
      const firstEmbed = EmbedBuilder.from(message.embeds[0]);

      const playerCount = await this.apPlayersService.countPlayers(event.id);

      firstEmbed.setDescription(
        `:busts_in_silhouette: ${playerCount} personne inscrite`,
      );
      firstEmbed.setFields([]);

      const embeds = new Array<EmbedBuilder>(firstEmbed);

      const players = await this.apPlayersService.findAll({ event });

      let embedId = 0;
      let fieldCount = 0;

      for (const player of players) {
        const lines = new Array<string>();
        for (const game of player.games) {
          const apWorld = game.apworld
            ? `[Apworld](${process.env.APP_URL}/ap-games/${game.id}/apworld) ✅`
            : 'Apworld :x:';

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
          const nextEmbed = new EmbedBuilder().setDescription('');
          embeds.push(nextEmbed);
        }
      }

      await message.edit({ embeds });
    }

    return interaction.reply({
      content: 'Fichiers bien enregisté',
      flags: 'Ephemeral',
    });
  }
}
