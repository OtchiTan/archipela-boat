import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApMessages } from './ap-messages.entity';

@Injectable()
export class ApMessagesService {
  constructor(
    @InjectRepository(ApMessages)
    private apMessagesRepository: Repository<ApMessages>,
  ) {}

  async createMessage(message: Partial<ApMessages>): Promise<ApMessages> {
    return await this.apMessagesRepository.save(message);
  }
}
