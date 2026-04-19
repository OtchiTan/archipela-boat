import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ArchiClientsController } from './archi-clients.controller';
import { ArchiClientsService } from './archi-clients.service';
import { ArchiClient } from './entities/archi-client.entity';

@Module({
  imports: [SequelizeModule.forFeature([ArchiClient])],
  controllers: [ArchiClientsController],
  providers: [ArchiClientsService],
})
export class ArchiClientsModule {}
