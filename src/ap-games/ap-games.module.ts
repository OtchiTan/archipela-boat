import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApGamesController } from './ap-games.controller';
import { ApGame } from './ap-games.entity';
import { ApGamesService } from './ap-games.service';

@Module({
  imports: [TypeOrmModule.forFeature([ApGame])],
  controllers: [ApGamesController],
  providers: [ApGamesService],
  exports: [ApGamesService],
})
export class ApGamesModule {}
