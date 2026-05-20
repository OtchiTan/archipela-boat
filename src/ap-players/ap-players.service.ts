import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApGamesService } from 'src/ap-games/ap-games.service';
import { PlayerStatsDto } from 'src/ap-players/dto/player-stats.dto';
import { FindOptionsWhere, Repository } from 'typeorm';
import { ApPlayer } from './ap-players.entity';

@Injectable()
export class ApPlayersService {
  constructor(
    @InjectRepository(ApPlayer)
    private apPlayerRepository: Repository<ApPlayer>,
    @Inject(forwardRef(() => ApGamesService))
    private readonly apGamesService: ApGamesService,
  ) {}

  async findAll(filter: FindOptionsWhere<ApPlayer>) {
    return await this.apPlayerRepository.find({
      where: filter,
      relations: { event: true, games: true },
    });
  }

  async findOne(player: Partial<ApPlayer>): Promise<ApPlayer | null> {
    return await this.apPlayerRepository.findOne({
      where: { ...player, event: { id: player.event?.id } },
      relations: { event: true, games: true },
    });
  }

  async delete(playerId: number) {
    const player = await this.findOne({ id: playerId });

    if (player === null) {
      throw new HttpException("Player doesn't exist", HttpStatus.BAD_GATEWAY);
    }

    await this.apPlayerRepository.delete({ id: playerId });
  }

  async create(data: Partial<ApPlayer>): Promise<ApPlayer> {
    const createdPlayer = await this.apPlayerRepository.save(data);
    const player = await this.findOne({ id: createdPlayer.id });

    if (player === null) {
      throw new HttpException("Can't create game", HttpStatus.BAD_REQUEST);
    }

    return player;
  }

  async update(id: number, data: Partial<ApPlayer>): Promise<ApPlayer> {
    await this.apPlayerRepository.update(id, {
      ...data,
      games: undefined,
      event: undefined,
    });
    const player = await this.findOne({ id });

    if (player === null) {
      throw new HttpException("Can't update game", HttpStatus.BAD_REQUEST);
    }

    return player;
  }

  public async countPlayers(eventId: number): Promise<number> {
    return await this.apPlayerRepository.count({
      where: { event: { id: eventId } },
    });
  }

  public async getStats(playerId: number): Promise<PlayerStatsDto> {
    const player = await this.findOne({ id: playerId });

    if (player === null) {
      throw new HttpException("Player doesn't exist", HttpStatus.NOT_FOUND);
    }

    const stats = new PlayerStatsDto();
    stats.playerId = player.id;
    stats.playerName = player.username;

    const gameStatsPromises = player.games.map((game) =>
      this.apGamesService.getStats(game.id),
    );

    stats.gamesStats = await Promise.all(gameStatsPromises);
    stats.playtime = stats.gamesStats.reduce((accumulator, game) => {
      return accumulator + game.playtime;
    }, 0);
    stats.deathlink = stats.gamesStats.reduce((accumulator, game) => {
      return accumulator + game.deathlink;
    }, 0);
    stats.killCount = stats.gamesStats.reduce((accumulator, game) => {
      return accumulator + game.killCount;
    }, 0);

    return stats;
  }
}
