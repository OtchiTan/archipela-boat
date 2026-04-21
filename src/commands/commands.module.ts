import { Module } from '@nestjs/common';
import { ApPlayersModule } from 'src/ap-players/ap-players.module';
import { RegisterCommand } from './register.command';
import { SetupApCommand } from './setup-ap.command';

@Module({
  imports: [ApPlayersModule],
  controllers: [],
  providers: [RegisterCommand, SetupApCommand],
})
export class CommandsModule {}
