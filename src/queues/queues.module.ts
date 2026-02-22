import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailProcessor } from './processors/email.processor';
import { EmailProducer } from './producers/email.producer';
import { EmailModule } from 'src/email/email.module';
import { QueueNames } from './constants/queue-names.constants';

@Module({
  imports: [BullModule.registerQueue({ name: QueueNames.EMAIL }), EmailModule],
  providers: [EmailProcessor, EmailProducer],
  exports: [EmailProducer],
})
export class QueuesModule {}
