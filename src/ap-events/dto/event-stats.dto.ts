import { ApiProperty } from '@nestjs/swagger';
import { ApDeathlink } from 'src/ap-deathlinks/ap-deathlinks.entity';
import { PlayerStatsDto } from 'src/ap-players/dto/player-stats.dto';

export class EventStatsDto {
  @ApiProperty()
  eventId!: number;

  @ApiProperty()
  eventName!: string;

  @ApiProperty()
  playersStats: PlayerStatsDto[] = [];

  @ApiProperty()
  startTime?: Date;

  @ApiProperty()
  endTime?: Date;

  @ApiProperty()
  playtime: number = 0;

  @ApiProperty()
  deathlink: number = 0;

  @ApiProperty()
  killCount: number = 0;

  @ApiProperty()
  unknownDeathlinks: ApDeathlink[] = [];
}
