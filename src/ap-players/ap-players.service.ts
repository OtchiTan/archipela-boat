import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateApPlayerDto } from './dto/create-ap-players.dto';
import { ApPlayer } from './entities/ap-players.entity';

@Injectable()
export class ApPlayersService {
  constructor(
    @InjectModel(ApPlayer) private apPlayerRepository: typeof ApPlayer,
  ) {}

  async findAll() {
    return await this.apPlayerRepository.findAll();
  }

  async findOne(id: number) {
    return await this.apPlayerRepository.findByPk(id);
  }

  async create(createApPlayerDto: CreateApPlayerDto) {
    return await this.apPlayerRepository.create(createApPlayerDto as any);
  }
}
