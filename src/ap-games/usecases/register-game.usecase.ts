import { HttpService } from '@nestjs/axios';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { IncomingMessage } from 'http';
import { join } from 'path';
import { ApEventsService } from 'src/ap-events/ap-events.service';
import { ApPlayer } from 'src/ap-players/ap-players.entity';
import { ApPlayersService } from 'src/ap-players/ap-players.service';
import { RegisterDto } from 'src/commands/dto/register.dto';
import { CoreGamesService } from 'src/core-games/core-games.service';
import { parse as yamlParse } from 'yaml';
import { ApGame } from '../ap-games.entity';
import { ApGamesService } from '../ap-games.service';

@Injectable()
export class RegisterGameUseCase {
  constructor(
    @Inject(forwardRef(() => ApGamesService))
    private apGamesService: ApGamesService,
    @Inject(forwardRef(() => ApPlayersService))
    private apPlayersService: ApPlayersService,
    @Inject(forwardRef(() => ApEventsService))
    private apEventsService: ApEventsService,
    @Inject(forwardRef(() => CoreGamesService))
    private coreGamesService: CoreGamesService,
    private readonly httpService: HttpService,
  ) {}

  public async registerGame(
    registerDto: RegisterDto,
    channelId: string,
    userId: string,
    userDisplayName: string,
  ) {
    if (!registerDto.yaml.name.endsWith('.yaml')) {
      throw new Error(
        "Le fichier fourni n'est pas un fichier yaml. Veuillez fournir un fichier yaml.",
      );
    }

    if (registerDto.apworld && !registerDto.apworld.name.endsWith('.apworld')) {
      throw new Error(
        "Le fichier apworld fourni n'est pas un fichier apworld. Veuillez fournir un fichier .apworld valide.",
      );
    }

    const event = await this.apEventsService.findEvent({
      channelId: channelId,
    });

    if (event === null) {
      throw new Error("Il n'y à pas d'êvenement démarré dans ce channel");
    }

    let yamlData: Record<string, string>;

    try {
      const { data } = await this.httpService.axiosRef.get<string>(
        registerDto.yaml.url,
      );

      yamlData = yamlParse(data) as Record<string, string>;
    } catch {
      throw new Error('Impossible de récupérer le fichier yaml');
    }

    let apWorldFilePath: string | undefined;
    if (registerDto.apworld) {
      try {
        const folderPath = join(process.cwd(), '.tmp', 'yaml');
        apWorldFilePath = join(folderPath, registerDto.apworld.name);
        if (!existsSync(folderPath)) {
          mkdirSync(folderPath, { recursive: true });
        }

        const writer = createWriteStream(apWorldFilePath);

        const response = await this.httpService.axiosRef.get<IncomingMessage>(
          registerDto.apworld.url,
          { responseType: 'stream' },
        );

        response.data.pipe(writer);
      } catch {
        throw new Error('Impossible de récupérer le fichier apworld');
      }
    }

    let apPlayer = await this.apPlayersService.findOne({
      event,
      discord_id: userId,
    });
    if (apPlayer !== null) {
      apPlayer.username = userDisplayName;
      await this.apPlayersService.update(apPlayer.id, apPlayer);
    } else {
      apPlayer = new ApPlayer();
      apPlayer.event = event;
      apPlayer.discord_id = userId;
      apPlayer.username = userDisplayName;
      apPlayer = await this.apPlayersService.create(apPlayer);
    }

    let apGame = await this.apGamesService.findOne({
      event,
      slot: yamlData.name,
    });
    if (apGame !== null) {
      if (apGame.player.discord_id !== userId) {
        throw new Error(
          'Un autre joueur utilise déjà ce slot (name), veuillez modifier votre yaml',
        );
      }

      if (apGame.name !== yamlData.game) {
        throw new Error(
          'Un autre jeu utilise déjà ce slot (name), veuillez modifier votre yaml',
        );
      }

      apGame.yaml = JSON.stringify(yamlData);
      apGame.apworld = apWorldFilePath;

      await this.apGamesService.update(apGame.id, apGame);
    } else {
      apGame = new ApGame();
      apGame.player = apPlayer;
      apGame.event = event;
      apGame.name = yamlData.game;
      apGame.slot = yamlData.name;
      apGame.yaml = JSON.stringify(yamlData);
      apGame.apworld = apWorldFilePath;
      apGame.isCoreGame = await this.coreGamesService.isCoreGame(apGame.name);

      apGame = await this.apGamesService.create(apGame);
    }
  }
}
