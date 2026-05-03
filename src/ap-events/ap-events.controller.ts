import { Controller, Get, Param } from '@nestjs/common';
import { ApEventsService } from './ap-events.service';

@Controller('ap-events')
export class ApEventsController {
  constructor(private readonly apEventsService: ApEventsService) {}

  @Get('/:id')
  async findOne(@Param('id') id: number) {
    return this.apEventsService.findEvent({ id });
  }

  @Get()
  async findAll() {
    return this.apEventsService.findAll();
  }

  @Get(':id/files')
  async getFiles(@Param('id') id: number) {
    return this.apEventsService.getEventFiles(id);
  }

  @Get(':id/playtime')
  async getPlaytimes(@Param('id') id: number) {
    return this.apEventsService.getPlaytime(id);
  }

  @Get(':id/deathlinks')
  async getDeathlinks(@Param('id') id: number) {
    return this.apEventsService.getDeathlinks(id);
  }
}
