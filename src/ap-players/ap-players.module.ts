import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApPlayersController } from './ap-players.controller';
import { ApPlayersService } from './ap-players.service';
import { ApPlayer } from './entities/ap-players.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ApPlayer])],
  controllers: [ApPlayersController],
  providers: [ApPlayersService],
  exports: [ApPlayersService],
})
export class ApPlayersModule {}
