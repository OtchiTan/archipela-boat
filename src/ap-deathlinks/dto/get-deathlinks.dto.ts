import { ApiProperty } from '@nestjs/swagger';

export class getDeathlinksDto {
  @ApiProperty()
  eventId?: number;
}
