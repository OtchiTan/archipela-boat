import { forwardRef, Module } from '@nestjs/common';
import { ApEventsModule } from 'src/ap-events/ap-events.module';
import { ApGamesModule } from 'src/ap-games/ap-games.module';
import { ApMessagesModule } from 'src/ap-messages/ap-messages.module';
import { ApSessionsModule } from 'src/ap-sessions/ap-sessions.module';
import { ClearMessagesCommand } from './clear-messages.command';
import { CloseApCommand } from './close-ap.command';
import { DeathlinkCommand } from './deathlink.command';
import { GetFilesCommand } from './get-files.command';
import { PingCommand } from './ping.command';
import { RegisterAdminCommand } from './register-admin.command';
import { RegisterCommand } from './register.command';
import { SetupAdminLogsCommand } from './setup-admin-logs.command';
import { SetupApCommand } from './setup-ap.command';
import { SetupLogsCommand } from './setup-logs.command';
import { StartApCommand } from './start-ap.command';
import { UnregisterCommand } from './unregister.command';
import { UpdateMessageCommand } from './update-message.command';

@Module({
  imports: [
    forwardRef(() => ApEventsModule),
    forwardRef(() => ApGamesModule),
    forwardRef(() => ApMessagesModule),
    forwardRef(() => ApSessionsModule),
  ],
  controllers: [],
  providers: [
    RegisterCommand,
    RegisterAdminCommand,
    SetupApCommand,
    ClearMessagesCommand,
    StartApCommand,
    UnregisterCommand,
    GetFilesCommand,
    CloseApCommand,
    UpdateMessageCommand,
    SetupLogsCommand,
    SetupAdminLogsCommand,
    DeathlinkCommand,
    PingCommand,
  ],
})
export class CommandsModule {}
