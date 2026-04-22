import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateApPlayerDto } from './dto/create-ap-players.dto';
import { ApPlayer } from './entities/ap-players.entity';

@Injectable()
export class ApPlayersService {
  constructor(
    @InjectRepository(ApPlayer)
    private apPlayerRepository: Repository<ApPlayer>,
  ) {}

  async findAll() {
    return await this.apPlayerRepository.find({ relations: ['event'] });
  }

  async findOne(id: number) {
    return await this.apPlayerRepository.findOne({
      where: { id },
      relations: ['event'],
    });
  }

  async create(createApPlayerDto: CreateApPlayerDto) {
    return await this.apPlayerRepository.save(createApPlayerDto);
  }
}
