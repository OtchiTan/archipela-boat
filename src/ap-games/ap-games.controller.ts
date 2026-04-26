import { Controller } from '@nestjs/common';
import { ApGamesService } from './ap-games.service';

@Controller('ap-games')
export class ApGamesController {
  constructor(private readonly apGamesService: ApGamesService) {}
}
