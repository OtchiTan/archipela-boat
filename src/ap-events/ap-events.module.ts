import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApPlayersModule } from 'src/ap-players/ap-players.module';
import { ApEventsController } from './ap-events.controller';
import { ApEvent } from './ap-events.entity';
import { ApEventsService } from './ap-events.service';

@Module({
  imports: [TypeOrmModule.forFeature([ApEvent]), ApPlayersModule],
  controllers: [ApEventsController],
  providers: [ApEventsService],
  exports: [ApEventsService],
})
export class ApEventsModule {}
