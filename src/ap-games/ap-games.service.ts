import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApEvent } from 'src/ap-events/ap-events.entity';
import { EntityNotFoundError, Repository } from 'typeorm';
import { ApGame } from './ap-games.entity';

@Injectable()
export class ApGamesService {
  constructor(
    @InjectRepository(ApGame)
    private apGameRepository: Repository<ApGame>,
  ) {}

  async findOne(game: Partial<ApGame>): Promise<ApGame> {
    const foundedGame = await this.apGameRepository.findOne({
      where: game,
      relations: { event: true, player: true },
    });
    if (!foundedGame) {
      throw new EntityNotFoundError(ApGame, game);
    }
    return foundedGame;
  }

  async create(game: Partial<ApGame>): Promise<ApGame> {
    return await this.apGameRepository.save(game);
  }

  async update(id: number, game: Partial<ApGame>): Promise<ApGame> {
    await this.apGameRepository.update(id, game);
    return await this.findOne({ id });
  }

  public async increaseDeathlinkCount(
    event: ApEvent,
    slot: string,
  ): Promise<void> {
    const game = await this.findOne({ slot, event });
    game.deathlinkCount += 1;
    await this.apGameRepository.save(game);
  }
}
