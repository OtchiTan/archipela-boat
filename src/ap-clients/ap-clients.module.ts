import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApClientsController } from './ap-clients.controller';
import { ApClientsService } from './ap-clients.service';
import { ApClient } from './entities/ap-clients.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ApClient])],
  controllers: [ApClientsController],
  providers: [ApClientsService],
})
export class ApClientsModule {}
