import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  StreamableFile,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Channel, Client, EmbedBuilder, TextChannel } from 'discord.js';
import { createReadStream, existsSync, mkdirSync, writeFileSync } from 'fs';
import { basename, join } from 'path';
import { ApDeathlinksService } from 'src/ap-deathlinks/ap-deathlinks.service';
import { ApEvent } from 'src/ap-events/ap-events.entity';
import { ApEventsService } from 'src/ap-events/ap-events.service';
import { ApPlayersService } from 'src/ap-players/ap-players.service';
import { ApSession } from 'src/ap-sessions/ap-sessions.entity';
import { ApSessionsService } from 'src/ap-sessions/ap-sessions.service';
import { RegisterDto } from 'src/commands/dto/register.dto';
import { UnregisterDto } from 'src/commands/dto/unregister.dto';
import { DiscordError } from 'src/core/discord.error';
import { IsNull, Repository } from 'typeorm';
import { stringify as yamlStringify } from 'yaml';
import { ApGame } from './ap-games.entity';
import { GameStatsDto } from './dto/game-stats.dto';
import { IncreaseDeathlinkCountUseCase } from './usecases/increase-deathlink-count.usecase';
import { RegisterGameUseCase } from './usecases/register-game.usecase';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonArray;
type JsonArray = JsonValue[];
interface JsonObject {
  [key: string]: JsonValue;
}

@Injectable()
export class ApGamesService {
  constructor(
    @InjectRepository(ApGame)
    private apGameRepository: Repository<ApGame>,
    @Inject(forwardRef(() => ApEventsService))
    private apEventsService: ApEventsService,
    @Inject(forwardRef(() => ApPlayersService))
    private apPlayersService: ApPlayersService,
    @Inject(forwardRef(() => ApDeathlinksService))
    private apDeathlinksService: ApDeathlinksService,
    @Inject(forwardRef(() => ApSessionsService))
    private apSessionsService: ApSessionsService,
    @Inject()
    private increaseDeathlinkCountUseCase: IncreaseDeathlinkCountUseCase,
    @Inject() private readonly registerGameUseGame: RegisterGameUseCase,
    private readonly client: Client,
  ) {}

  async findOne(game: Partial<ApGame>): Promise<ApGame | null> {
    return await this.apGameRepository.findOne({
      where: { ...game, event: { id: game.event?.id } },
      relations: { event: true, player: true },
    });
  }

  async getYamlFile(id: number): Promise<StreamableFile> {
    const apGame = await this.findOne({ id });

    if (apGame === null) {
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    }

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

    if (apGame === null) {
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    }

    if (apGame.apworld === undefined) {
      throw new HttpException('NotFound', HttpStatus.NOT_FOUND);
    }

    const file = createReadStream(apGame.apworld);

    return new StreamableFile(file, {
      type: 'application/apworld',
      disposition: `attachment; filename="${basename(apGame.apworld)}"`,
    });
  }

  async create(data: Partial<ApGame>): Promise<ApGame> {
    const createGame = await this.apGameRepository.save(data);
    const game = await this.findOne({ id: createGame.id });

    if (game === null) {
      throw new HttpException("Can't create game", HttpStatus.BAD_REQUEST);
    }

    return game;
  }

  async update(id: number, data: Partial<ApGame>): Promise<ApGame> {
    await this.apGameRepository.update(id, data);
    const game = await this.findOne({ id });

    if (game === null) {
      throw new HttpException("Can't update game", HttpStatus.BAD_REQUEST);
    }

    return game;
  }

  public async startSession(event: ApEvent, slot: string, deathlink: boolean) {
    const game = await this.findOne({ slot, event });

    if (game === null) {
      throw new HttpException('Game Not Found', HttpStatus.NOT_FOUND);
    }

    const currentSession = await this.apSessionsService.findCurrentSession(
      game.id,
    );

    if (currentSession) {
      await this.stopSession(event, slot);
    }

    const apSession = new ApSession();
    apSession.start = new Date();
    apSession.game = game;
    apSession.deathlink = deathlink;

    await this.apSessionsService.create(apSession);
  }

  public async stopSession(event: ApEvent, slot: string) {
    const game = await this.findOne({ slot, event });

    if (game === null) {
      throw new HttpException('Game Not Found', HttpStatus.NOT_FOUND);
    }

    const session = await this.apSessionsService.findCurrentSession(game.id);

    if (session === null) {
      throw new HttpException('Session Not Found', HttpStatus.NOT_FOUND);
    }

    session.end = new Date();

    await this.apSessionsService.update(session.id, session);
  }

  public async registerGame(
    registerDto: RegisterDto,
    channelId: string,
    userId: string,
    userDisplayName: string,
  ) {
    const apGame = await this.registerGameUseGame.registerGame(
      registerDto,
      channelId,
      userId,
      userDisplayName,
    );

    const event = await this.apEventsService.findEvent({
      channelId: channelId,
      endTime: IsNull(),
    });

    if (event === null) {
      throw new DiscordError(
        "Il n'y à pas d'êvenement démarré dans ce channel",
      );
    }

    this.apEventsService.updateEmbeds(event).catch((err) => console.error(err));

    if (event.adminLogChannelId === undefined) {
      return;
    }

    let channel: Channel | null;
    try {
      channel = await this.client.channels.fetch(event.adminLogChannelId);
    } catch {
      console.error('Aucun channel admin défini');
      return;
    }

    if (!channel || !channel.isTextBased()) {
      console.error('Aucun channel admin défini');
      return;
    }

    const deathlink = this.checkDeathlink(apGame.yaml);

    await (channel as TextChannel).send({
      embeds: [
        new EmbedBuilder()
          .setTitle('Nouveau jeu enregistré')
          .setDescription(`👥 ${apGame.player.username} - 🎮 ${apGame.name}`)
          .addFields({
            name: apGame.slot,
            value: `[YAML](${process.env.APP_URL}/ap-games/${apGame.id}/yaml)`,
          })
          .addFields({
            name: 'Deathlink ?',
            value: deathlink,
          }),
      ],
    });
  }

  parseDeathlinkValue(value: JsonValue): string {
    if (value === null || value === undefined) {
      return ':interrobang: Incertain';
    }

    if (typeof value === 'boolean') {
      return value ? '✅ Activé' : ':x: Desactivé';
    }

    if (typeof value === 'number') {
      if (value === 0) return ':x: Desactivé';
      if (value > 0) return '✅ Activé';
      return ':interrobang: Incertain';
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();

      const disabledValues = [
        'false',
        'off',
        '0',
        'disabled',
        'none',
        'no',
        'false_death',
      ];
      if (disabledValues.includes(normalized)) {
        return ':x: Desactivé';
      }

      if (normalized.length > 0) {
        return '✅ Activé';
      }
    }

    return ':interrobang: Incertain';
  }

  findDeathlinkInStructure(data: JsonValue): string {
    if (typeof data !== 'object' || data === null) {
      return ':interrobang: Incertain';
    }

    if (Array.isArray(data)) {
      for (const item of data) {
        const result = this.findDeathlinkInStructure(item);
        if (result !== ':interrobang: Incertain') return result;
      }
      return ':interrobang: Incertain';
    }

    for (const [key, value] of Object.entries(data)) {
      const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (normalizedKey.includes('deathlink')) {
        const result = this.parseDeathlinkValue(value);
        if (result !== ':interrobang: Incertain') {
          return result;
        }
      }

      if (typeof value === 'object' && value !== null) {
        const nestedResult = this.findDeathlinkInStructure(value);
        if (nestedResult !== 'Incertain') {
          return nestedResult;
        }
      }
    }

    return ':interrobang: Incertain';
  }

  public checkDeathlink(input: JsonValue | string): string {
    let parsedData: JsonValue;

    if (typeof input === 'string') {
      try {
        parsedData = JSON.parse(input) as JsonValue;
      } catch {
        return ':interrobang: Incertain';
      }
    } else {
      parsedData = input;
    }

    return this.findDeathlinkInStructure(parsedData);
  }

  public async unregisterGame(
    unregisterDto: UnregisterDto,
    channelId: string,
    userId: string,
    isAdmin: boolean,
  ) {
    const event = await this.apEventsService.findEvent({ channelId });

    if (event === null) {
      throw new DiscordError(
        "Il n'y à pas d'êvenement démarré dans ce channel",
      );
    }

    const game = await this.findOne({ slot: unregisterDto.slot, event });

    if (game === null) {
      throw new DiscordError(
        'Aucun jeu trouvé avec ce slot pour cet êvenement',
      );
    }

    if (!isAdmin && userId !== game.player.discord_id) {
      throw new DiscordError("Ce slot ne t'appartient pas");
    }

    const playerId = game.player.id;

    await this.apGameRepository.delete({ id: game.id });

    const player = await this.apPlayersService.findOne({ id: playerId });

    if (player === null) {
      throw new DiscordError(
        "Le joueur n'existe pas (ptdr si ce message sort un jour c'est que quelqu'un à fait joujoue avec la bdd",
      );
    }

    if (player.games.length === 0) {
      await this.apPlayersService.delete(playerId);
    }

    this.apEventsService.updateEmbeds(event).catch((err) => console.error(err));
  }

  public async countGames(eventId: number): Promise<number> {
    return await this.apGameRepository.count({
      where: { event: { id: eventId } },
    });
  }

  public async getStats(gameId: number): Promise<GameStatsDto> {
    const game = await this.findOne({ id: gameId });

    if (game === null) {
      throw new HttpException("Game doesn't exist", HttpStatus.NOT_FOUND);
    }

    const playtime = new GameStatsDto();
    playtime.gameId = game.id;
    playtime.gameName = game.name;
    playtime.slot = game.slot;
    playtime.playtime = await this.apSessionsService.getPlaytime(gameId);
    playtime.deathlink = await this.apDeathlinksService.countDeathlink(gameId);
    playtime.killCount =
      await this.apDeathlinksService.countDeathlinkKillCount(gameId);

    return playtime;
  }

  async increaseDeathlinkCount(
    event: ApEvent,
    slot: string,
    timestamp: number,
    cause: string | undefined,
  ) {
    await this.increaseDeathlinkCountUseCase.increaseDeathlinkCount(
      event,
      slot,
      timestamp,
      cause,
    );
  }
}
