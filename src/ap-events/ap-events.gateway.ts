import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { forwardRef, Inject } from '@nestjs/common';
import { Namespace, Socket } from 'socket.io';
import { ApDeathlink } from 'src/ap-deathlinks/ap-deathlinks.entity';
import { ApGamesService } from 'src/ap-games/ap-games.service';
import { ApEventsService } from './ap-events.service';

@WebSocketGateway({ namespace: 'events' })
export class ApEventsGateway implements OnGatewayConnection {
  @WebSocketServer()
  namespace!: Namespace;

  constructor(
    @Inject(forwardRef(() => ApEventsService))
    private readonly apEventsService: ApEventsService,
    @Inject(forwardRef(() => ApGamesService))
    private readonly apGamesService: ApGamesService,
  ) {}

  async handleConnection(client: Socket) {
    const eventId = client.handshake.query.eventId;

    if (typeof eventId !== 'string' || isNaN(Number(eventId))) {
      client.disconnect(true);
      return;
    }

    const event = await this.apEventsService.findEvent({ id: Number(eventId) });

    if (event === null) {
      client.disconnect(true);
      return;
    }

    await client.join(eventId);
  }

  public async onNewDeathlink(deathlink: ApDeathlink): Promise<void> {
    const game = await this.apGamesService.findOne({ id: deathlink.game.id });

    if (game === null) {
      return;
    }

    const eventId = game.event.id;

    const eventDeathlinks = await this.apEventsService.getDeathlinks(eventId);

    this.namespace.to(String(eventId)).emit('deathlink-top', eventDeathlinks);
  }
}
