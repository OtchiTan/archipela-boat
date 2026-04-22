import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApEventsController } from './ap-events.controller';
import { ApEventsService } from './ap-events.service';
import { ApEvent } from './entities/ap-events.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ApEvent])],
  controllers: [ApEventsController],
  providers: [ApEventsService],
  exports: [ApEventsService],
})
export class ApEventsModule {}
