import { ApiProperty } from '@nestjs/swagger';
import { PlayerPlaytimeDto } from 'src/ap-sessions/dto/player-playtime.dto';

export class EventPlaytimeDto {
  @ApiProperty()
  eventId!: number;

  @ApiProperty()
  eventName!: string;

  @ApiProperty()
  playersPlaytime: PlayerPlaytimeDto[] = [];

  @ApiProperty()
  playtime: number = 0;
}
