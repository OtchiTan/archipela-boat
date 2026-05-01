import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, Repository } from 'typeorm';
import { ApPlayer } from './ap-players.entity';

@Injectable()
export class ApPlayersService {
  constructor(
    @InjectRepository(ApPlayer)
    private apPlayerRepository: Repository<ApPlayer>,
  ) {}

  async findAll(filter: Partial<ApPlayer>) {
    return await this.apPlayerRepository.find({
      where: { ...filter, event: { id: filter.event?.id } },
      relations: { event: true, games: true },
    });
  }

  async findOne(player: Partial<ApPlayer>): Promise<ApPlayer> {
    const foundedPlayer = await this.apPlayerRepository.findOne({
      where: { ...player, event: { id: player.event?.id } },
      relations: { event: true, games: true },
    });
    if (!foundedPlayer) {
      throw new EntityNotFoundError(ApPlayer, player);
    }
    return foundedPlayer;
  }

  async create(player: Partial<ApPlayer>): Promise<ApPlayer> {
    const createdPlayer = await this.apPlayerRepository.save(player);
    return this.findOne({ id: createdPlayer.id });
  }

  async update(id: number, player: Partial<ApPlayer>): Promise<ApPlayer> {
    await this.apPlayerRepository.update(id, {
      ...player,
      games: undefined,
      event: undefined,
    });
    return await this.findOne({ id });
  }

  public async countPlayers(eventId: number): Promise<number> {
    return await this.apPlayerRepository.count({
      where: { event: { id: eventId } },
    });
  }
}
