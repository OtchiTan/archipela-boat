import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { IntentsBitField } from 'discord.js';
import { NecordModule } from 'necord';
import { ArchiClientsModule } from './ap-players/archi-clients.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RegisterCommand } from './commands/register.command';
import { SetupArchiCommand } from './commands/setup-archi.command';
import { dataBaseConfig } from './database.config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    NecordModule.forRoot({
      token: process.env.DISCORD_TOKEN ?? '',
      intents: [IntentsBitField.Flags.Guilds],
      development: [process.env.DISCORD_DEVELOPMENT_GUILD_ID ?? ''],
    }),
    SequelizeModule.forRoot(dataBaseConfig),
    ArchiClientsModule,
  ],
  controllers: [AppController],
  providers: [AppService, RegisterCommand, SetupArchiCommand],
})
export class AppModule {}
