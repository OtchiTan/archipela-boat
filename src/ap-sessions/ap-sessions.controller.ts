import { Controller } from '@nestjs/common';
import { ApSessionsService } from './ap-sessions.service';

@Controller('ap-sessions')
export class ApSessionsController {
  constructor(private readonly apSessionsService: ApSessionsService) {}
}
