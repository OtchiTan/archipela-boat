import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntentsBitField } from 'discord.js';
import { NecordModule } from 'necord';
import { ApEventsModule } from './ap-events/ap-events.module';
import { ApPlayersModule } from './ap-players/ap-players.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommandsModule } from './commands/commands.module';
import { RegisterCommand } from './commands/register.command';
import { SetupApCommand } from './commands/setup-ap.command';
import { ApClientsModule } from './ap-clients/ap-clients.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    NecordModule.forRoot({
      token: process.env.DISCORD_TOKEN ?? '',
      intents: [IntentsBitField.Flags.Guilds],
      development: [process.env.DISCORD_DEVELOPMENT_GUILD_ID ?? ''],
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: '.db/archipela-boat',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    CommandsModule,
    ApPlayersModule,
    ApEventsModule,
    ApClientsModule,
  ],
  controllers: [AppController],
  providers: [AppService, RegisterCommand, SetupApCommand],
})
export class AppModule {}
