import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { ApSession } from './ap-sessions.entity';

@Injectable()
export class ApSessionsService {
  constructor(
    @InjectRepository(ApSession)
    private apSessionRepository: Repository<ApSession>,
  ) {}

  async findOne(session: Partial<ApSession>): Promise<ApSession | null> {
    return await this.apSessionRepository.findOne({
      where: { ...session, game: { id: session.game?.id } },
      relations: { game: true },
    });
  }

  async findCurrentSession(gameId: number) {
    return await this.apSessionRepository.findOne({
      where: { game: { id: gameId }, start: Not(IsNull()), end: IsNull() },
      relations: { game: true },
    });
  }

  async create(data: Partial<ApSession>): Promise<ApSession> {
    const createSession = await this.apSessionRepository.save(data);
    const session = await this.findOne({ id: createSession.id });

    if (session === null) {
      throw new HttpException("Can't create session", HttpStatus.BAD_REQUEST);
    }

    return session;
  }

  async update(id: number, data: Partial<ApSession>): Promise<ApSession> {
    await this.apSessionRepository.update(id, data);
    const session = await this.findOne({ id });

    if (session === null) {
      throw new HttpException("Can't update session", HttpStatus.BAD_REQUEST);
    }

    return session;
  }

  async getPlaytime(gameId: number): Promise<number> {
    const sessions = await this.apSessionRepository.find({
      where: { game: { id: gameId }, end: Not(IsNull()) },
      relations: { game: true },
    });

    return sessions.reduce((accumulator, session) => {
      const start = session.start.getTime();
      const end = session.end?.getTime() ?? 0;
      return accumulator + (end - start);
    }, 0);
  }
}
