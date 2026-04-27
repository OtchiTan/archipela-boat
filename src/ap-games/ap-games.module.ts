import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApEventsModule } from 'src/ap-events/ap-events.module';
import { ApPlayersModule } from 'src/ap-players/ap-players.module';
import { ApGamesController } from './ap-games.controller';
import { ApGame } from './ap-games.entity';
import { ApGamesService } from './ap-games.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApGame]),
    forwardRef(() => ApPlayersModule),
    forwardRef(() => ApEventsModule),
    HttpModule,
  ],
  controllers: [ApGamesController],
  providers: [ApGamesService],
  exports: [ApGamesService],
})
export class ApGamesModule {}
