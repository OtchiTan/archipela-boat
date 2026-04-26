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

  async findAll() {
    return await this.apPlayerRepository.find({
      relations: { event: true, games: true },
    });
  }

  async findOne(player: Partial<ApPlayer>): Promise<ApPlayer> {
    const foundedPlayer = await this.apPlayerRepository.findOne({
      where: player,
      relations: { event: true, games: true },
    });
    if (!foundedPlayer) {
      throw new EntityNotFoundError(ApPlayer, player);
    }
    return foundedPlayer;
  }

  async create(player: Partial<ApPlayer>): Promise<ApPlayer> {
    return await this.apPlayerRepository.save(player);
  }

  async update(id: number, player: Partial<ApPlayer>): Promise<ApPlayer> {
    console.log(`Updating player with ID: ${id} Data:`, player);
    await this.apPlayerRepository.update(id, player);
    return await this.findOne({ id });
  }
}
