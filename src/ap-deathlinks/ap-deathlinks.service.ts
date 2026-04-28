import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApDeathlink } from './ap-deathlinks.entity';

@Injectable()
export class ApDeathlinksService {
  constructor(
    @InjectRepository(ApDeathlink)
    private apDeathlinkRepository: Repository<ApDeathlink>,
  ) {}

  async create(deathlink: Partial<ApDeathlink>): Promise<ApDeathlink> {
    return await this.apDeathlinkRepository.save(deathlink);
  }
}
