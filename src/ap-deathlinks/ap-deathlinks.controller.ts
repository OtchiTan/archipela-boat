import { Controller, Get, Query } from '@nestjs/common';
import { ApDeathlink } from './ap-deathlinks.entity';
import { ApDeathlinksService } from './ap-deathlinks.service';
import { getDeathlinksDto } from './dto/get-deathlinks.dto';

@Controller('ap-deathlinks')
export class ApDeathlinksController {
  constructor(private readonly apDeathlinksService: ApDeathlinksService) {}

  @Get()
  async getDeathlinks(
    @Query() getDeathlinksDto: getDeathlinksDto,
  ): Promise<ApDeathlink[]> {
    return await this.apDeathlinksService.getAllDeathlinks(getDeathlinksDto);
  }
}
