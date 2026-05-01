import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApDeathlinksModule } from 'src/ap-deathlinks/ap-deathlinks.module';
import { ApEventsModule } from 'src/ap-events/ap-events.module';
import { ApPlayersModule } from 'src/ap-players/ap-players.module';
import { CoreGamesModule } from 'src/core-games/core-games.module';
import { ApGamesController } from './ap-games.controller';
import { ApGame } from './ap-games.entity';
import { ApGamesService } from './ap-games.service';
import { RegisterGameUseCase } from './usecases/register-game.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApGame]),
    forwardRef(() => ApPlayersModule),
    forwardRef(() => ApEventsModule),
    forwardRef(() => ApDeathlinksModule),
    HttpModule,
    CoreGamesModule,
  ],
  controllers: [ApGamesController],
  providers: [ApGamesService, RegisterGameUseCase],
  exports: [ApGamesService],
})
export class ApGamesModule {}
