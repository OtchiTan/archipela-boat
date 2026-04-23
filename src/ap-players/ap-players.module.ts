import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApPlayersController } from './ap-players.controller';
import { ApPlayer } from './ap-players.entity';
import { ApPlayersService } from './ap-players.service';

@Module({
  imports: [TypeOrmModule.forFeature([ApPlayer])],
  controllers: [ApPlayersController],
  providers: [ApPlayersService],
  exports: [ApPlayersService],
})
export class ApPlayersModule {}
