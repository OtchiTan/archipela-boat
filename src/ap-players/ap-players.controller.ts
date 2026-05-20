import { Controller, Get, Param } from '@nestjs/common';
import { ApPlayersService } from './ap-players.service';
import { GetPlayersDto } from './dto/get-players.dto';
import { PlayerStatsDto } from './dto/player-stats.dto';

@Controller('ap-players')
export class ApPlayersController {
  constructor(private readonly apPlayersService: ApPlayersService) {}

  @Get()
  findAll(getPlayersDto: GetPlayersDto) {
    return this.apPlayersService.findAll({
      event: { id: getPlayersDto.eventId },
    });
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.apPlayersService.findOne({ id });
  }

  @Get(':id/playtime')
  getPlaytime(@Param('id') id: number): Promise<PlayerStatsDto> {
    return this.apPlayersService.getStats(id);
  }
}
