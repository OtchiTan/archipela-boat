import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from 'archipelago.js';
import { IsNull, Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { ApClient } from './entities/ap-clients.entity';

@Injectable()
export class ApClientsService {
  public client?: Client;
  constructor(
    @InjectRepository(ApClient)
    private readonly apClientRepository: Repository<ApClient>,
  ) {
    this.connectClient().catch((err) => {
      console.error('Failed to connect to AP client:', err);
    });
  }

  public async login(loginDto: LoginDto) {
    await this.apClientRepository.save({
      url: loginDto.url,
      slot: loginDto.slot,
    });

    if (this.client === undefined) {
      await this.connectClient();
    }
  }

  async getCurrentApClient(): Promise<ApClient | null> {
    return await this.apClientRepository.findOne({
      where: { endTime: IsNull() },
      order: { id: 'DESC' },
    });
  }

  async connectClient() {
    const apClient = await this.getCurrentApClient();

    if (!apClient) {
      return;
    }

    this.client = new Client();

    await this.client.login(apClient.url, apClient.slot);
  }
}
