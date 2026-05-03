import { ApiProperty } from '@nestjs/swagger';
import { GameDeathlinkDto } from 'src/ap-games/dto/game-deathlink.dto';

export class PlayerDeathlinkDto {
  @ApiProperty()
  playerId!: number;

  @ApiProperty()
  playerName!: string;

  @ApiProperty()
  gamesDeathlinks: GameDeathlinkDto[] = [];

  @ApiProperty()
  deathlink: number = 0;

  @ApiProperty()
  killCount: number = 0;
}
