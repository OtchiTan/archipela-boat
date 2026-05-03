import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApGamesModule } from 'src/ap-games/ap-games.module';
import { ApPlayersController } from './ap-players.controller';
import { ApPlayer } from './ap-players.entity';
import { ApPlayersService } from './ap-players.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApPlayer]),
    forwardRef(() => ApGamesModule),
  ],
  controllers: [ApPlayersController],
  providers: [ApPlayersService],
  exports: [ApPlayersService],
})
export class ApPlayersModule {}
