import { Controller } from '@nestjs/common';
import { ApDeathlinksService } from './ap-deathlinks.service';

@Controller('ap-deathlinks')
export class ApDeathlinksController {
  constructor(private readonly apDeathlinksService: ApDeathlinksService) {}
}
