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

  async countDeathlink(gameId: number): Promise<number> {
    return await this.apDeathlinkRepository.count({
      where: { game: { id: gameId } },
    });
  }

  async countDeathlinkKillCount(gameId: number): Promise<number> {
    return (
      (await this.apDeathlinkRepository.sum('killCount', {
        game: { id: gameId },
      })) ?? 0
    );
  }
}
