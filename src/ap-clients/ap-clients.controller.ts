import { Body, Controller, Post } from '@nestjs/common';
import { ApClientsService } from './ap-clients.service';
import { LoginDto } from './dto/login.dto';

@Controller('ap-clients')
export class ApClientsController {
  constructor(private readonly apClientsService: ApClientsService) {}

  @Post('login')
  public async login(@Body() loginDto: LoginDto) {
    await this.apClientsService.login(loginDto);
  }
}
