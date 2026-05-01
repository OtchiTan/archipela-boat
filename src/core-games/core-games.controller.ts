import { Controller } from '@nestjs/common';
import { CoreGamesService } from './core-games.service';

@Controller('core-games')
export class CoreGamesController {
  constructor(private readonly coreGamesService: CoreGamesService) {}
}
