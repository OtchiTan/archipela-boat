import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, Repository } from 'typeorm';
import { ApEvent } from './ap-events.entity';

@Injectable()
export class ApEventsService {
  constructor(
    @InjectRepository(ApEvent) private apEventRepository: Repository<ApEvent>,
  ) {}

  async findAll() {
    return await this.apEventRepository.find({
      relations: { players: true },
    });
  }

  async findEvent(filter: Partial<ApEvent>): Promise<ApEvent> {
    const event = await this.apEventRepository.findOne({
      where: filter,
      relations: { players: true },
    });
    if (!event) {
      throw new EntityNotFoundError(ApEvent, filter);
    }
    return event;
  }

  async createEvent(channelId: string) {
    const event = new ApEvent();
    event.channelId = channelId;
    return await this.apEventRepository.save(event);
  }

  async updateEvent(eventId: number, data: Partial<ApEvent>) {
    console.log('Updating event with ID:', eventId, 'Data:', data);
    await this.apEventRepository.update(eventId, data);
  }
}
