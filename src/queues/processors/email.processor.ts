import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { QueueNames } from '../constants/queue-names.constants';
import { Job } from 'bullmq';
import { EmailJobNames } from '../producers/email.producer';
import { EmailService } from 'src/email/email.service';
import { Logger } from '@nestjs/common';

@Processor(QueueNames.EMAIL, { concurrency: 2 })
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job) {
    switch (job.name) {
      case EmailJobNames.WELCOME:
        await this.emailService.sendWelcome(
          job.data as { to: string; name: string },
        );
        break;
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`Processing job with id ${job.id}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job with id ${job.id} COMPLETED!`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job) {
    this.logger.error(
      `Job with id ${job.id} FAILED! Attempt Number ${job.attemptsMade}`,
    );
  }
}
