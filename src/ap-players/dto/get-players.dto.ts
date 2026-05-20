import { ApiProperty } from '@nestjs/swagger';

export class GetPlayersDto {
  @ApiProperty()
  eventId?: number;
}
