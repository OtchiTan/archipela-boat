import { Inject, Injectable } from '@nestjs/common';
import { Client } from 'archipelago.js';
import { ApEventsService } from 'src/ap-events/ap-events.service';
import { ApPlayersService } from 'src/ap-players/ap-players.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class ApClientsService {
  public client?: Client;
  constructor(
    @Inject() private readonly apEventsService: ApEventsService,
    @Inject() private readonly apPlayersService: ApPlayersService,
  ) {
    this.connectClient().catch((err) => {
      console.error('Failed to connect to AP client:', err);
    });
  }

  public async login(loginDto: LoginDto) {
    const event = await this.apEventsService.findEvent({});

    await this.apEventsService.updateEvent(event?.id, {
      url: loginDto.url,
    });

    if (this.client === undefined) {
      await this.connectClient();
    }
  }

  async connectClient() {
    const apEvent = await this.apEventsService.findEvent({});

    this.client = new Client();

    await this.client.login(apEvent.url ?? '', apEvent.players[0].slot ?? '');
    this.client.deathLink.enableDeathLink();

    this.client.deathLink.on('deathReceived', (slot) => {
      this.apPlayersService.increaseDeathlinkCount(slot).catch((err) => {
        throw err;
      });
    });
  }
}
