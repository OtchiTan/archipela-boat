import { Controller } from '@nestjs/common';
import { ApClientsService } from './ap-clients.service';

@Controller('ap-clients')
export class ApClientsController {
  constructor(private readonly apClientsService: ApClientsService) {}
}
