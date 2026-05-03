import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApSessionsService } from 'src/ap-sessions/ap-sessions.service';
import { GamePlaytimeDto } from 'src/ap-sessions/dto/game-playtime.dto';
import { PlayerPlaytimeDto } from 'src/ap-sessions/dto/player-playtime.dto';
import { Repository } from 'typeorm';
import { ApPlayer } from './ap-players.entity';

@Injectable()
export class ApPlayersService {
  constructor(
    @InjectRepository(ApPlayer)
    private apPlayerRepository: Repository<ApPlayer>,
    @Inject(forwardRef(() => ApSessionsService))
    private readonly apSessionsService: ApSessionsService,
  ) {}

  async findAll(filter: Partial<ApPlayer>) {
    return await this.apPlayerRepository.find({
      where: { ...filter, event: { id: filter.event?.id } },
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

  public async getPlayTime(playerId: number): Promise<PlayerPlaytimeDto> {
    const player = await this.apPlayerRepository.findOne({
      where: { id: playerId },
      relations: { games: true },
    });

    if (player === null) {
      throw new HttpException('Player not found', HttpStatus.NOT_FOUND);
    }

    const sessions = await this.apSessionsService.getPlaytime(player.id);

    const playtime = new PlayerPlaytimeDto();
    playtime.playerId = player.id;
    playtime.playerName = player.username;

    for (const session of sessions) {
      let gameIndex = playtime.gamesPlaytime.findIndex(
        (game) => game.gameId === session.game.id,
      );

      if (gameIndex === -1) {
        const gamePlaytimeDto = new GamePlaytimeDto();
        gamePlaytimeDto.gameId = session.game.id;
        gamePlaytimeDto.gameName = session.game.name;
        gameIndex = playtime.gamesPlaytime.push(gamePlaytimeDto) - 1;
      }

      playtime.gamesPlaytime[gameIndex].playtime += 1;
    }

    return playtime;
  }
}
