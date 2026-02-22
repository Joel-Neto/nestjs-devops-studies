import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QueueNames } from '../constants/queue-names.constants';
import { InjectQueue } from '@nestjs/bullmq';

export const EmailJobNames = {
  WELCOME: 'welcome-email',
} as const;

@Injectable()
export class EmailProducer {
  constructor(
    @InjectQueue(QueueNames.EMAIL)
    private readonly emailQueue: Queue,
  ) {}

  async addWelcomeEmail(payload: { email: string; name: string }) {
    await this.emailQueue.add(
      EmailJobNames.WELCOME,
      {
        to: payload.email,
        name: payload.name,
      },
      {
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }
}
