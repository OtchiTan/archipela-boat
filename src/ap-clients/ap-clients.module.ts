import { Module } from '@nestjs/common';
import { ApClientsService } from './ap-clients.service';
import { ApClientsController } from './ap-clients.controller';

@Module({
  controllers: [ApClientsController],
  providers: [ApClientsService],
})
export class ApClientsModule {}
