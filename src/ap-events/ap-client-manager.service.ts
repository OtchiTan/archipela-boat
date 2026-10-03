import { Injectable, OnModuleDestroy } from '@nestjs/common';
import {
  ApClient,
  type ApClientDeathlinks,
  type ApClientEvents,
  type ApClientGames,
} from './ap-client';

@Injectable()
export class ApClientManagerService implements OnModuleDestroy {
  private readonly clients = new Map<number, ApClient>();
  private readonly operations = new Map<number, Promise<void>>();

  async start(
    apEventsService: ApClientEvents,
    apDeathlinksService: ApClientDeathlinks,
    apGamesService: ApClientGames,
    eventId: number,
    reportConnectionFailure = false,
  ) {
    await this.runExclusive(eventId, async () => {
      await this.stopClient(eventId);

      const client = new ApClient(
        apEventsService,
        apDeathlinksService,
        apGamesService,
      );
      this.clients.set(eventId, client);
      await client.connectClient(eventId, reportConnectionFailure);
    });
  }

  async stop(eventId: number) {
    await this.runExclusive(eventId, () => this.stopClient(eventId));
  }

  async onModuleDestroy() {
    await Promise.all(
      [...this.clients.keys()].map((eventId) => this.stop(eventId)),
    );
  }

  private async stopClient(eventId: number) {
    const client = this.clients.get(eventId);
    if (!client) {
      return;
    }

    this.clients.delete(eventId);
    await client.disconnectClient();
  }

  private async runExclusive(eventId: number, operation: () => Promise<void>) {
    const previous = this.operations.get(eventId) ?? Promise.resolve();
    const current = previous.catch(() => undefined).then(operation);
    this.operations.set(eventId, current);

    try {
      await current;
    } finally {
      if (this.operations.get(eventId) === current) {
        this.operations.delete(eventId);
      }
    }
  }
}
