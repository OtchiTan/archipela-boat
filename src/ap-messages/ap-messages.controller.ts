import { Controller } from '@nestjs/common';
import { ApMessagesService } from './ap-messages.service';

@Controller('ap-messages')
export class ApMessagesController {
  constructor(private readonly apMessagesService: ApMessagesService) {}
}
