import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ApPlayersController } from './ap-players.controller';
import { ApPlayersService } from './ap-players.service';
import { ApPlayer } from './entities/ap-players.entity';

@Module({
  imports: [SequelizeModule.forFeature([ApPlayer])],
  controllers: [ApPlayersController],
  providers: [ApPlayersService],
  exports: [ApPlayersService],
})
export class ApPlayersModule {}
