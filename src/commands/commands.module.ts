import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ApEventsModule } from 'src/ap-events/ap-events.module';
import { ApGamesModule } from 'src/ap-games/ap-games.module';
import { ApPlayersModule } from 'src/ap-players/ap-players.module';
import { ClearMessagesCommand } from './clear-messages.command';
import { RegisterCommand } from './register.command';
import { SetupApCommand } from './setup-ap.command';

@Module({
  imports: [ApPlayersModule, ApEventsModule, ApGamesModule, HttpModule],
  controllers: [],
  providers: [RegisterCommand, SetupApCommand, ClearMessagesCommand],
})
export class CommandsModule {}
