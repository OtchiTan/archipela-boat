import { Controller, Get, Param } from '@nestjs/common';
import { ApEventsService } from './ap-events.service';

@Controller('ap-events')
export class ApEventsController {
  constructor(private readonly apEventsService: ApEventsService) {}

  @Get('/:id')
  async findOne(@Param('id') id: number) {
    console.log('Getting event with id:', id);
    return this.apEventsService.getEventById(id);
  }

  @Get()
  async findAll() {
    return this.apEventsService.findAll();
  }
}
