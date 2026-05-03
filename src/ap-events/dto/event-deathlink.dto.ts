import { ApiProperty } from '@nestjs/swagger';
import { PlayerDeathlinkDto } from 'src/ap-players/dto/player-deathlink.dto';

export class EventDeathlinkDto {
  @ApiProperty()
  eventId!: number;

  @ApiProperty()
  eventName!: string;

  @ApiProperty()
  playerDeathlinks: PlayerDeathlinkDto[] = [];

  @ApiProperty()
  deathlink: number = 0;

  @ApiProperty()
  killCount: number = 0;
}
