import { ApiProperty } from '@nestjs/swagger';

export class GameDeathlinkDto {
  @ApiProperty()
  gameId!: number;

  @ApiProperty()
  slot!: string;

  @ApiProperty()
  gameName!: string;

  @ApiProperty()
  deathlink: number = 0;

  @ApiProperty()
  killCount: number = 0;
}
