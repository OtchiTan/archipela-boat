import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  StreamableFile,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createReadStream, existsSync, mkdirSync, writeFileSync } from 'fs';
import { basename, join } from 'path';
import { ApDeathlink } from 'src/ap-deathlinks/ap-deathlinks.entity';
import { ApDeathlinksService } from 'src/ap-deathlinks/ap-deathlinks.service';
import { ApEvent } from 'src/ap-events/ap-events.entity';
import { ApEventsService } from 'src/ap-events/ap-events.service';
import { RegisterDto } from 'src/commands/dto/register.dto';
import { EntityNotFoundError, Repository } from 'typeorm';
import { stringify as yamlStringify } from 'yaml';
import { ApGame } from './ap-games.entity';
import { RegisterGameUseCase } from './usecases/register-game.usecase';

@Injectable()
export class ApGamesService {
  constructor(
    @InjectRepository(ApGame)
    private apGameRepository: Repository<ApGame>,
    @Inject(forwardRef(() => ApEventsService))
    private apEventsService: ApEventsService,
    @Inject(forwardRef(() => ApDeathlinksService))
    private apDeathlinksService: ApDeathlinksService,
    @Inject() private readonly registerGameUseGame: RegisterGameUseCase,
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

  public async registerGame(
    registerDto: RegisterDto,
    channelId: string,
    userId: string,
    userDisplayName: string,
  ) {
    await this.registerGameUseGame.registerGame(
      registerDto,
      channelId,
      userId,
      userDisplayName,
    );

    const event = await this.apEventsService.findEvent({
      channelId: channelId,
    });

    await this.apEventsService.updateEmbeds(event);
  }
}
