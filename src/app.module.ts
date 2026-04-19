import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { IntentsBitField } from 'discord.js';
import { NecordModule } from 'necord';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArchiClientsModule } from './archi-clients/archi-clients.module';
import { RegisterCommand } from './commands/register.command';
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
  providers: [AppService, RegisterCommand],
})
export class AppModule {}
