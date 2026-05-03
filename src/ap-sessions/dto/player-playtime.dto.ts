import { ApiProperty } from '@nestjs/swagger';
import { GamePlaytimeDto } from './game-playtime.dto';

export class PlayerPlaytimeDto {
  @ApiProperty()
  playerId!: number;

  @ApiProperty()
  playerName!: string;

  @ApiProperty()
  gamesPlaytime: GamePlaytimeDto[] = [];

  @ApiProperty()
  playtime: number = 0;
}
