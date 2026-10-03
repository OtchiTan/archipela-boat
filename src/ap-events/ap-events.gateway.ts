import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { forwardRef, Inject } from '@nestjs/common';
import { Client } from 'discord.js';
import { Namespace, Socket } from 'socket.io';
import { ApDeathlink } from 'src/ap-deathlinks/ap-deathlinks.entity';
import { ApGamesService } from 'src/ap-games/ap-games.service';
import { ApEventsService } from './ap-events.service';
import { EventStatsDto } from './dto/event-stats.dto';

@WebSocketGateway({ namespace: 'events' })
export class ApEventsGateway implements OnGatewayConnection {
  @WebSocketServer()
  namespace!: Namespace;

  constructor(
    @Inject(forwardRef(() => ApEventsService))
    private readonly apEventsService: ApEventsService,
    @Inject(forwardRef(() => ApGamesService))
    private readonly apGamesService: ApGamesService,
    private readonly client: Client,
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
    const eventStats = await this.apEventsService.getStats(deathlink.event.id);

    const game = await this.apGamesService.findOne({ id: deathlink.game?.id });

    this.namespace
      .to(String(deathlink.event.id))
      .emit('deathlink-top', eventStats, deathlink, game); //FIXME: C'est vraiment dégueu va falloir faire plus propre

    await this.switchTopDeathlinkRole(deathlink, eventStats);
  }

  public async switchTopDeathlinkRole(
    deathlink: ApDeathlink,
    eventStats: EventStatsDto,
  ) {
    if (!deathlink.event.topDeathlinkRoleId) return;

    const topDeathlinkPlayerStats = eventStats.playersStats.reduce(
      (top, current) => (current.killCount > top.killCount ? current : top),
      eventStats.playersStats[0],
    );

    if (
      topDeathlinkPlayerStats.playerDiscordId ===
      deathlink.event.topDeathlinkOwnerId
    )
      return;

    const guild = await this.client.guilds.fetch(deathlink.event.guildId);

    if (!guild) return;

    const role = await guild.roles.fetch(deathlink.event.topDeathlinkRoleId, {
      force: true,
    });

    if (!role) {
      return;
    }

    if (deathlink.event.topDeathlinkOwnerId) {
      const oldTopMember = await guild.members.fetch(
        deathlink.event.topDeathlinkOwnerId,
      );

      if (oldTopMember) {
        await oldTopMember.roles.remove(role);
      }
    }

    const newTopMember = await guild.members.fetch(
      topDeathlinkPlayerStats.playerDiscordId,
    );

    if (newTopMember) {
      await newTopMember.roles.add(role);
    }

    await this.apEventsService.updateEvent(deathlink.event.id, {
      topDeathlinkOwnerId: topDeathlinkPlayerStats.playerDiscordId,
    });
  }
}
