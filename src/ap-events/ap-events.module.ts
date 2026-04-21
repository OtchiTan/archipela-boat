import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ApEventsController } from './ap-events.controller';
import { ApEventsService } from './ap-events.service';
import { ApEvent } from './entities/ap-events.entity';

@Module({
  imports: [SequelizeModule.forFeature([ApEvent])],
  controllers: [ApEventsController],
  providers: [ApEventsService],
  exports: [ApEventsService],
})
export class ApEventsModule {}
