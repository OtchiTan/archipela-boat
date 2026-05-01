import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreGamesController } from './core-games.controller';
import { CoreGame } from './core-games.entity';
import { CoreGamesService } from './core-games.service';

@Module({
  imports: [TypeOrmModule.forFeature([CoreGame]), HttpModule],
  controllers: [CoreGamesController],
  providers: [CoreGamesService],
  exports: [CoreGamesService],
})
export class CoreGamesModule {}
