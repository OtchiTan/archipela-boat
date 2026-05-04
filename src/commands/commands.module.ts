import { forwardRef, Module } from '@nestjs/common';
import { ApEventsModule } from 'src/ap-events/ap-events.module';
import { ApGamesModule } from 'src/ap-games/ap-games.module';
import { ClearMessagesCommand } from './clear-messages.command';
import { CloseApCommand } from './close-ap.command';
import { GetFilesCommand } from './get-files.command';
import { RegisterAdminCommand } from './register-admin.command';
import { RegisterCommand } from './register.command';
import { SetupApCommand } from './setup-ap.command';
import { StartApCommand } from './start-ap.command';
import { UnregisterCommand } from './unregister.command';
import { UpdateMessageCommand } from './update-message.command';

@Module({
  imports: [forwardRef(() => ApEventsModule), forwardRef(() => ApGamesModule)],
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
  ],
})
export class CommandsModule {}
