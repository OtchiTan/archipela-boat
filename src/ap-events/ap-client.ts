import { Client } from 'archipelago.js';
import { ApEventsService } from 'src/ap-events/ap-events.service';
import { ApPlayersService } from 'src/ap-players/ap-players.service';

export class ApClient {
  public client?: Client;
  constructor(
    private readonly apEventsService: ApEventsService,
    private apPlayersService: ApPlayersService,
  ) {}

  async connectClient(url: string) {
    const apEvent = await this.apEventsService.findEvent({ url });

    this.client = new Client();

    await this.client.login(url, apEvent.players[0].slot ?? '');
    this.client.deathLink.enableDeathLink();

    this.client.deathLink.on('deathReceived', (slot) => {
      this.apPlayersService.increaseDeathlinkCount(slot).catch((err) => {
        throw err;
      });
    });

    console.log('Client connected on url : ' + url);
  }
}
