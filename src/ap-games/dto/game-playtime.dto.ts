import { ApiProperty } from '@nestjs/swagger';

export class GamePlaytimeDto {
  @ApiProperty()
  gameId!: number;

  @ApiProperty()
  slot!: string;

  @ApiProperty()
  gameName!: string;

  @ApiProperty()
  playtime: number = 0;
}
