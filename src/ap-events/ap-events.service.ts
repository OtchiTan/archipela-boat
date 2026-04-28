import { forwardRef, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApGamesService } from 'src/ap-games/ap-games.service';
import { ApPlayersService } from 'src/ap-players/ap-players.service';
import { StartApDto } from 'src/commands/dto/start-ap.dto';
import { EntityNotFoundError, IsNull, Not, Repository } from 'typeorm';
import { ApClient } from './ap-client';
import { ApEvent } from './ap-events.entity';

@Injectable()
export class ApEventsService implements OnModuleInit {
  apClients: Map<string, ApClient> = new Map();

  constructor(
    @InjectRepository(ApEvent) private apEventRepository: Repository<ApEvent>,
    @Inject(forwardRef(() => ApPlayersService))
    private apPlayersService: ApPlayersService,
    @Inject(forwardRef(() => ApGamesService))
    private apGamesService: ApGamesService,
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

  async findEvent(filter: Partial<ApEvent>): Promise<ApEvent> {
    const event = await this.apEventRepository.findOne({
      where: filter,
      relations: { players: true, games: true },
    });
    if (!event) {
      throw new EntityNotFoundError(ApEvent, filter);
    }
    return event;
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

    if (event.games.length === 0) {
      throw new Error("Il n'y à aucun joueurs enregistrés sur l'êvenement");
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
}
