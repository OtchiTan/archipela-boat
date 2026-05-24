import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  OnModuleInit,
  StreamableFile,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'fs';
import JSZip from 'jszip';
import { basename, join } from 'path';
import { ApDeathlinksService } from 'src/ap-deathlinks/ap-deathlinks.service';
import { ApGamesService } from 'src/ap-games/ap-games.service';
import { ApPlayersService } from 'src/ap-players/ap-players.service';
import { StartApDto } from 'src/commands/dto/start-ap.dto';
import { DiscordError } from 'src/core/discord.error';
import { FindOptionsWhere, IsNull, Not, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/browser';
import { stringify as yamlStringify } from 'yaml';
import { ApClient } from './ap-client';
import { ApEvent } from './ap-events.entity';
import { EventStatsDto } from './dto/event-stats.dto';
import { UpdateEmbedsUseCase } from './usecases/update-embeds.usecase';

@Injectable()
export class ApEventsService implements OnModuleInit {
  apClients: Map<string, ApClient> = new Map();

  constructor(
    @InjectRepository(ApEvent) private apEventRepository: Repository<ApEvent>,
    @Inject(forwardRef(() => ApPlayersService))
    private apPlayersService: ApPlayersService,
    @Inject(forwardRef(() => ApGamesService))
    private apGamesService: ApGamesService,
    @Inject(forwardRef(() => ApDeathlinksService))
    private apDeathlinksService: ApDeathlinksService,
    @Inject() private readonly updateEmbedsUseCase: UpdateEmbedsUseCase,
  ) {}

  async onModuleInit() {
    const events = await this.apEventRepository.find({
      where: {
        url: Not(IsNull()),
        startTime: Not(IsNull()),
        endTime: IsNull(),
      },
    });

    for (const event of events) {
      await this.startNewApClient(event.url!);
    }
  }

  async findAll() {
    return await this.apEventRepository.find({
      relations: { players: true },
    });
  }

  async findEvent(filter: FindOptionsWhere<ApEvent>): Promise<ApEvent | null> {
    return await this.apEventRepository.findOne({
      where: filter,
      relations: { players: true, games: true, messages: true },
    });
  }

  async createEvent(event: Partial<ApEvent>): Promise<ApEvent> {
    return await this.apEventRepository.save(event);
  }

  async updateEvent(eventId: number, data: QueryDeepPartialEntity<ApEvent>) {
    await this.apEventRepository.update(eventId, data);
    const event = await this.findEvent({ id: eventId });
    if (event === null) {
      return;
    }
    this.updateEmbeds(event).catch((err) => console.error(err));
  }

  public async stopAp(channelId: string) {
    const event = await this.findEvent({ channelId, endTime: IsNull() });

    if (event === null) {
      throw new DiscordError(
        "Il n'y à aucun événement à fermer dans ce channel",
      );
    }

    await this.updateEvent(event.id, {
      endTime: new Date(),
      url: undefined,
    });

    await this.closeApClient(event.url ?? '');
  }

  public async startAp(channelId: string, startApDto: StartApDto) {
    const event = await this.findEvent({ channelId, endTime: IsNull() });

    if (event === null) {
      throw new DiscordError(
        "Il n'y à aucun événement à démarrer dans ce channel",
      );
    }

    if (event.games.length === 0) {
      throw new DiscordError(
        "Il n'y à aucun joueurs enregistrés sur l'êvenement",
      );
    }

    const apClient = this.apClients.get(event.url ?? '');
    if (apClient) {
      await apClient.disconnectClient();
      this.apClients.delete(event.url ?? '');
    }

    await this.updateEvent(event.id, {
      url: startApDto.url,
      startTime: event.startTime ?? new Date(),
    });

    await this.startNewApClient(startApDto.url);
  }

  async startNewApClient(url: string) {
    const apClient = new ApClient(
      this,
      this.apDeathlinksService,
      this.apGamesService,
    );
    this.apClients.set(url, apClient);
    await apClient.connectClient(url);
  }

  async closeApClient(url: string) {
    const apClient = this.apClients.get(url);

    if (apClient) {
      await apClient?.disconnectClient();

      this.apClients.delete(url);
    }
  }

  public async updateEmbeds(event: ApEvent) {
    await this.updateEmbedsUseCase.updateMessageEmbeds(event);
  }

  public async getEventFiles(eventId: number) {
    const event = await this.findEvent({ id: eventId });

    if (event === null) {
      throw new HttpException("Event doesn't exist", HttpStatus.NOT_FOUND);
    }

    const eventFolder = join(
      process.cwd(),
      '.tmp',
      'event-files',
      event.id.toString(),
    );

    const yamlFolder = join(eventFolder, 'yaml');
    if (!existsSync(yamlFolder)) {
      mkdirSync(yamlFolder, { recursive: true });
    }

    const apWorldFolder = join(eventFolder, 'apworld');
    if (!existsSync(apWorldFolder)) {
      mkdirSync(apWorldFolder, { recursive: true });
    }

    const zip = new JSZip();
    zip.folder('yaml');
    zip.folder('apworld');

    for (const game of event.games) {
      const yamlPath = join('yaml', `${game.slot}.yaml`);

      const fileData = JSON.parse(game.yaml) as Record<string, any>;
      fileData.name = game.slot;

      const yamlData = yamlStringify(fileData);

      zip.file(yamlPath, yamlData);

      if (game.apworld) {
        const apWorldPath = join('apworld', basename(game.apworld));
        const apworld = readFileSync(game.apworld);
        zip.file(apWorldPath, apworld);
      }
    }

    const zipPath = join(eventFolder, 'event.zip');

    const content = await zip.generateAsync({ type: 'blob' });
    writeFileSync(zipPath, Buffer.from(await content.arrayBuffer()));

    const file = createReadStream(zipPath);
    return new StreamableFile(file, {
      type: 'application/zip',
      disposition: `attachment; filename="event-${event.id}.zip"`,
    });
  }

  public async getStats(eventId: number): Promise<EventStatsDto> {
    const event = await this.findEvent({ id: eventId });

    if (event === null) {
      throw new HttpException("Event doesn't exist", HttpStatus.NOT_FOUND);
    }

    const stats = new EventStatsDto();
    stats.eventId = event.id;
    stats.eventName = event.name;
    stats.startTime = event.startTime;
    stats.endTime = event.endTime;
    stats.unknownDeathlinks =
      await this.apDeathlinksService.getUnknownDeathlinks(event.id);

    const playerStatsPromises = event.players.map((player) =>
      this.apPlayersService.getStats(player.id),
    );

    stats.playersStats = await Promise.all(playerStatsPromises);
    stats.playtime = stats.playersStats.reduce((accumulator, game) => {
      return accumulator + game.playtime;
    }, 0);
    stats.deathlink = stats.playersStats.reduce((accumulator, game) => {
      return accumulator + game.deathlink;
    }, 0);
    stats.deathlink += stats.unknownDeathlinks.length;
    stats.killCount = stats.playersStats.reduce((accumulator, game) => {
      return accumulator + game.killCount;
    }, 0);
    stats.killCount = stats.unknownDeathlinks.reduce(
      (accumulator, deathlink) => {
        return accumulator + deathlink.killCount;
      },
      0,
    );

    return stats;
  }
}
