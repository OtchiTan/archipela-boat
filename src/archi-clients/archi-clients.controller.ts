import { Controller, Get, Param } from '@nestjs/common';
import { ArchiClientsService } from './archi-clients.service';

@Controller('archi-clients')
export class ArchiClientsController {
  constructor(private readonly archiClientsService: ArchiClientsService) {}

  @Get()
  findAll() {
    return this.archiClientsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.archiClientsService.findOne(+id);
  }
}
