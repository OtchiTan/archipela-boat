import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { IntentsBitField } from 'discord.js';
import { NecordModule } from 'necord';
import { ApPlayersModule } from './ap-players/ap-players.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommandsModule } from './commands/commands.module';
import { RegisterCommand } from './commands/register.command';
import { SetupApCommand } from './commands/setup-ap.command';
import { dataBaseConfig } from './database.config';
import { ApEventsModule } from './ap-events/ap-events.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    NecordModule.forRoot({
      token: process.env.DISCORD_TOKEN ?? '',
      intents: [IntentsBitField.Flags.Guilds],
      development: [process.env.DISCORD_DEVELOPMENT_GUILD_ID ?? ''],
    }),
    SequelizeModule.forRoot(dataBaseConfig),
    CommandsModule,
    ApPlayersModule,
    ApEventsModule,
  ],
  controllers: [AppController],
  providers: [AppService, RegisterCommand, SetupApCommand],
})
export class AppModule {}
