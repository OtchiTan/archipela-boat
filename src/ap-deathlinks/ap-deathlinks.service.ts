import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApEventsGateway } from 'src/ap-events/ap-events.gateway';
import { FindOptionsWhere, Repository } from 'typeorm';
import { ApDeathlink } from './ap-deathlinks.entity';

@Injectable()
export class ApDeathlinksService {
  constructor(
    @InjectRepository(ApDeathlink)
    private apDeathlinkRepository: Repository<ApDeathlink>,
    @Inject(forwardRef(() => ApEventsGateway))
    private readonly apEventsGateway: ApEventsGateway,
  ) {}

  async findDeathlink(
    filter: FindOptionsWhere<ApDeathlink>,
  ): Promise<ApDeathlink | null> {
    return await this.apDeathlinkRepository.findOne({
      where: filter,
      relations: { game: true },
    });
  }

  async create(data: Partial<ApDeathlink>): Promise<ApDeathlink | null> {
    const createdDeathlink = await this.apDeathlinkRepository.save(data);
    const deathlink = await this.findDeathlink({ id: createdDeathlink.id });
    if (deathlink) {
      await this.apEventsGateway.onNewDeathlink(deathlink);
    }
    return deathlink;
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
