import { Module } from '@nestjs/common';
import { ApEventsModule } from 'src/ap-events/ap-events.module';
import { ApPlayersModule } from 'src/ap-players/ap-players.module';
import { ApClientsController } from './ap-clients.controller';
import { ApClientsService } from './ap-clients.service';

@Module({
  imports: [ApEventsModule, ApPlayersModule],
  controllers: [ApClientsController],
  providers: [ApClientsService],
})
export class ApClientsModule {}
