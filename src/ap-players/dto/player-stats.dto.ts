import { ApiProperty } from '@nestjs/swagger';
import { GameStatsDto } from '../../ap-games/dto/game-stats.dto';

export class PlayerStatsDto {
  @ApiProperty()
  playerId!: number;

  @ApiProperty()
  playerName!: string;

  @ApiProperty()
  gamesStats: GameStatsDto[] = [];

  @ApiProperty()
  playtime: number = 0;

  @ApiProperty()
  deathlink: number = 0;

  @ApiProperty()
  killCount: number = 0;
}
