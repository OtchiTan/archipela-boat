import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApSessionsController } from './ap-sessions.controller';
import { ApSession } from './ap-sessions.entity';
import { ApSessionsService } from './ap-sessions.service';

@Module({
  imports: [TypeOrmModule.forFeature([ApSession])],
  controllers: [ApSessionsController],
  providers: [ApSessionsService],
  exports: [ApSessionsService],
})
export class ApSessionsModule {}
