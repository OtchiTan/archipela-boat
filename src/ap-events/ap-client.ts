import { Client } from 'archipelago.js';
import { ApEventsService } from 'src/ap-events/ap-events.service';
import { ApGamesService } from 'src/ap-games/ap-games.service';
import { ApPlayersService } from 'src/ap-players/ap-players.service';

export class ApClient {
  public client = new Client();
  constructor(
    private readonly apEventsService: ApEventsService,
    private readonly apPlayersService: ApPlayersService,
    private readonly apGamesService: ApGamesService,
  ) {}

  async connectClient(url: string) {
    const apEvent = await this.apEventsService.findEvent({ url });

    await this.client.login(url, apEvent.games[0].slot ?? '', '', {
      tags: ['AP', 'Tracker'],
    });
    this.client.deathLink.enableDeathLink();

    this.client.deathLink.on('deathReceived', (slot, timestamp, cause) => {
      console.log('On deathlink');
      this.apGamesService
        .increaseDeathlinkCount(apEvent, slot, timestamp, cause)
        .catch((err) => {
          console.log(err);
        });
    });

    console.log('Client connected on url : ' + url);
  }
}
