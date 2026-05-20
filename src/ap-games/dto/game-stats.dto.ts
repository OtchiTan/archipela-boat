import { ApiProperty } from '@nestjs/swagger';

export class GameStatsDto {
  @ApiProperty()
  gameId!: number;

  @ApiProperty()
  slot!: string;

  @ApiProperty()
  gameName!: string;

  @ApiProperty()
  playtime: number = 0;

  @ApiProperty()
  deathlink: number = 0;

  @ApiProperty()
  killCount: number = 0;
}
