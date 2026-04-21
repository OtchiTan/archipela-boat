import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ApPlayer } from 'src/ap-players/entities/ap-players.entity';
import { ApEvent } from './entities/ap-events.entity';

@Injectable()
export class ApEventsService {
  constructor(
    @InjectModel(ApEvent) private apEventRepository: typeof ApEvent,
  ) {}

  async findAll() {
    return await this.apEventRepository.findAll({
      include: [{ model: ApPlayer, as: 'players' }],
    });
  }

  async getEventById(eventId: number) {
    return await this.apEventRepository.findOne<ApEvent>({
      where: { id: eventId },
      raw: true,
    });
  }

  async createEvent(channelId: string) {
    const event = new ApEvent();
    event.channelId = channelId;
    const createdEvent = await this.apEventRepository.create(event as any);
    return await this.getEventById(createdEvent.id);
  }

  async updateEvent(eventId: number, data: Partial<ApEvent>) {
    await this.apEventRepository.update(data, { where: { id: eventId } });
  }
}
