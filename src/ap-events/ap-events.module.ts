import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApEventsController } from './ap-events.controller';
import { ApEvent } from './ap-events.entity';
import { ApEventsService } from './ap-events.service';

@Module({
  imports: [TypeOrmModule.forFeature([ApEvent])],
  controllers: [ApEventsController],
  providers: [ApEventsService],
  exports: [ApEventsService],
})
export class ApEventsModule {}
