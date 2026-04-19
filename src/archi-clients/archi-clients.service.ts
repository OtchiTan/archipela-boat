import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateArchiClientDto } from './dto/create-archi-client.dto';
import { ArchiClient } from './entities/archi-client.entity';

@Injectable()
export class ArchiClientsService {
  constructor(
    @InjectModel(ArchiClient) private archiClientRepository: typeof ArchiClient,
  ) {}

  async findAll() {
    return await this.archiClientRepository.findAll();
  }

  async findOne(id: number) {
    return await this.archiClientRepository.findByPk(id);
  }

  async create(createArchiClientDto: CreateArchiClientDto) {
    return await this.archiClientRepository.create(createArchiClientDto as any);
  }
}
