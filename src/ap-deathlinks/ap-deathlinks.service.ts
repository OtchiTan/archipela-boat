import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApEventsGateway } from 'src/ap-events/ap-events.gateway';
import { FindOptionsWhere, IsNull, Repository } from 'typeorm';
import { ApDeathlink } from './ap-deathlinks.entity';
import { getDeathlinksDto } from './dto/get-deathlinks.dto';

@Injectable()
export class ApDeathlinksService {
  constructor(
    @InjectRepository(ApDeathlink)
    private apDeathlinkRepository: Repository<ApDeathlink>,
    @Inject(forwardRef(() => ApEventsGateway))
    private readonly apEventsGateway: ApEventsGateway,
  ) {}

  async getAllDeathlinks(
    getDeathlinksDto: getDeathlinksDto,
  ): Promise<ApDeathlink[]> {
    return await this.apDeathlinkRepository.find({
      where: [
        { game: { event: { id: getDeathlinksDto.eventId } } },
        { game: IsNull() },
      ],
      relations: { game: { player: true } },
    });
  }

  async getUnknownDeathlinks(eventId: number): Promise<ApDeathlink[]> {
    return await this.apDeathlinkRepository.find({
      where: { event: { id: eventId }, game: IsNull() },
    });
  }

  async findDeathlink(
    filter: FindOptionsWhere<ApDeathlink>,
  ): Promise<ApDeathlink | null> {
    return await this.apDeathlinkRepository.findOne({
      where: filter,
      relations: { game: true, event: true },
    });
  }

  async getLatestDeathlink(eventId: number): Promise<ApDeathlink | null> {
    return await this.apDeathlinkRepository.findOne({
      where: { game: { event: { id: eventId } } },
      order: { id: 'DESC' },
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
