import { Module } from '@nestjs/common';
import { ApEventsModule } from 'src/ap-events/ap-events.module';
import { ApPlayersModule } from 'src/ap-players/ap-players.module';
import { RegisterCommand } from './register.command';
import { SetupApCommand } from './setup-ap.command';

@Module({
  imports: [ApPlayersModule, ApEventsModule],
  controllers: [],
  providers: [RegisterCommand, SetupApCommand],
})
export class CommandsModule {}
