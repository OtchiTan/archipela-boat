import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApEventsService } from './ap-events.service';
import { LoginDto } from './dto/login.dto';

@Controller('ap-events')
export class ApEventsController {
  constructor(private readonly apEventsService: ApEventsService) {}

  @Get('/:id')
  async findOne(@Param('id') id: number) {
    return this.apEventsService.findEvent({ id });
  }

  @Get()
  async findAll() {
    return this.apEventsService.findAll();
  }

  @Post('login')
  public async login(@Body() loginDto: LoginDto) {
    await this.apEventsService.login(loginDto);
  }
}
