import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApGamesModule } from 'src/ap-games/ap-games.module';
import { ApPlayersModule } from 'src/ap-players/ap-players.module';
import { ApEventsController } from './ap-events.controller';
import { ApEvent } from './ap-events.entity';
import { ApEventsGateway } from './ap-events.gateway';
import { ApEventsService } from './ap-events.service';
import { UpdateEmbedsUseCase } from './usecases/update-embeds.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApEvent]),
    forwardRef(() => ApPlayersModule),
    forwardRef(() => ApGamesModule),
  ],
  controllers: [ApEventsController],
  providers: [ApEventsService, UpdateEmbedsUseCase, ApEventsGateway],
  exports: [ApEventsService, ApEventsGateway],
})
export class ApEventsModule {}
