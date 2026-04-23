import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty()
  url!: string;

  @ApiProperty()
  slot!: string;

  @ApiProperty()
  password!: string;
}
