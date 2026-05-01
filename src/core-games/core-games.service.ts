import { HttpService } from '@nestjs/axios';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoreGame } from './core-games.entity';

@Injectable()
export class CoreGamesService implements OnModuleInit {
  constructor(
    @InjectRepository(CoreGame)
    private coreGameRepository: Repository<CoreGame>,
    private readonly httpService: HttpService,
  ) {}

  async onModuleInit() {
    await this.updateCoreGamesList();
    console.log('Game fetched');
  }

  async updateCoreGamesList() {
    await this.coreGameRepository.deleteAll();

    const { data } = await this.httpService.axiosRef.get<{
      games: Record<string, any>;
    }>('https://archipelago.gg/api/datapackage');

    const coreGames = Object.keys(data.games).map<Partial<CoreGame>>(
      (name) => ({
        name,
      }),
    );

    await this.coreGameRepository.save(coreGames);
  }

  public async isCoreGame(gameName: string): Promise<boolean> {
    const coreGame = await this.coreGameRepository.findOne({
      where: { name: gameName },
    });

    return coreGame !== null;
  }
}
