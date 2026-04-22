import { Controller, Get, Param } from '@nestjs/common';
import { ApPlayersService } from './ap-players.service';

@Controller('ap-players')
export class ApPlayersController {
  constructor(private readonly apPlayersService: ApPlayersService) {}

  @Get()
  findAll() {
    return this.apPlayersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.apPlayersService.findOne({ id });
  }
}
