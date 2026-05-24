import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApMessagesController } from './ap-messages.controller';
import { ApMessages } from './ap-messages.entity';
import { ApMessagesService } from './ap-messages.service';

@Module({
  imports: [TypeOrmModule.forFeature([ApMessages])],
  controllers: [ApMessagesController],
  providers: [ApMessagesService],
  exports: [ApMessagesService],
})
export class ApMessagesModule {}
