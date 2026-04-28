import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApDeathlinksController } from './ap-deathlinks.controller';
import { ApDeathlink } from './ap-deathlinks.entity';
import { ApDeathlinksService } from './ap-deathlinks.service';

@Module({
  imports: [TypeOrmModule.forFeature([ApDeathlink])],
  controllers: [ApDeathlinksController],
  providers: [ApDeathlinksService],
  exports: [ApDeathlinksService],
})
export class ApDeathlinksModule {}
