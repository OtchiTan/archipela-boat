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
import { ApGamesService } from 'src/ap-games/ap-games.service';
import { ApPlayersService } from 'src/ap-players/ap-players.service';
import { StartApDto } from 'src/commands/dto/start-ap.dto';
import { DiscordError } from 'src/core/discord.error';
import { FindOptionsWhere, IsNull, Not, Repository } from 'typeorm';
import { stringify as yamlStringify } from 'yaml';
import { ApClient } from './ap-client';
import { ApEvent } from './ap-events.entity';
import { EventDeathlinkDto } from './dto/event-deathlink.dto';
import { EventPlaytimeDto } from './dto/event-playtime.dto';
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
      relations: { players: true, games: true },
    });
  }

  async createEvent(event: Partial<ApEvent>): Promise<ApEvent> {
    return await this.apEventRepository.save(event);
  }

  async updateEvent(eventId: number, data: Partial<ApEvent>) {
    console.log('Updating event with ID:', eventId, 'Data:', data);
    await this.apEventRepository.update(eventId, data);
  }

  public async startAp(startApDto: StartApDto) {
    const event = await this.findEvent({});

    if (event === null) {
      throw new HttpException("Event doesn't exist", HttpStatus.NOT_FOUND);
    }

    if (event.games.length === 0) {
      throw new DiscordError(
        "Il n'y à aucun joueurs enregistrés sur l'êvenement",
      );
    }

    await this.updateEvent(event?.id, {
      url: startApDto.url,
      startTime: new Date(),
    });

    await this.startNewApClient(startApDto.url);
  }

  async startNewApClient(url: string) {
    const apClient = new ApClient(
      this,
      this.apPlayersService,
      this.apGamesService,
    );
    this.apClients.set(url, apClient);
    await apClient.connectClient(url);
  }

  closeApClient(url: string) {
    const apClient = this.apClients.get(url);

    if (apClient) {
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

  public async getPlaytime(eventId: number): Promise<EventPlaytimeDto> {
    const event = await this.findEvent({ id: eventId });

    if (event === null) {
      throw new HttpException("Event doesn't exist", HttpStatus.NOT_FOUND);
    }

    const playtime = new EventPlaytimeDto();
    playtime.eventId = event.id;
    playtime.eventName = event.name;

    const playerPlaytimesPromises = event.players.map((player) =>
      this.apPlayersService.getPlayTime(player.id),
    );

    playtime.playersPlaytime = await Promise.all(playerPlaytimesPromises);
    playtime.playtime = playtime.playersPlaytime.reduce(
      (accumulator, player) => {
        return accumulator + player.playtime;
      },
      0,
    );

    return playtime;
  }

  public async getDeathlinks(eventId: number): Promise<EventDeathlinkDto> {
    const event = await this.findEvent({ id: eventId });

    if (event === null) {
      throw new HttpException("Event doesn't exist", HttpStatus.NOT_FOUND);
    }

    const deathlinks = new EventDeathlinkDto();
    deathlinks.eventId = event.id;
    deathlinks.eventName = event.name;

    const playerDeathLinksPromises = event.players.map((player) =>
      this.apPlayersService.getDeathlinks(player.id),
    );

    deathlinks.playerDeathlinks = await Promise.all(playerDeathLinksPromises);
    deathlinks.deathlink = deathlinks.playerDeathlinks.reduce(
      (accumulator, player) => {
        return accumulator + player.deathlink;
      },
      0,
    );
    deathlinks.killCount = deathlinks.playerDeathlinks.reduce(
      (accumulator, player) => {
        return accumulator + player.killCount;
      },
      0,
    );

    return deathlinks;
  }
}
