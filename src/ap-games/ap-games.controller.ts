import { Controller, Get, Param, StreamableFile } from '@nestjs/common';
import { ApGamesService } from './ap-games.service';
import { GamePlaytimeDto } from './dto/game-playtime.dto';

@Controller('ap-games')
export class ApGamesController {
  constructor(private readonly apGamesService: ApGamesService) {}

  @Get(':id/yaml')
  async getYaml(@Param('id') id: number): Promise<StreamableFile> {
    return await this.apGamesService.getYamlFile(id);
  }

  @Get(':id/apworld')
  async getApWorld(@Param('id') id: number): Promise<StreamableFile> {
    return await this.apGamesService.getApWorldFile(id);
  }

  @Get(':id/playtime')
  getPlaytime(@Param('id') id: number): Promise<GamePlaytimeDto> {
    return this.apGamesService.getPlayTime(id);
  }

  @Get(':id/deathlinks')
  async getDeathlinks(@Param('id') id: number) {
    return this.apGamesService.getDeathlinks(id);
  }
}
