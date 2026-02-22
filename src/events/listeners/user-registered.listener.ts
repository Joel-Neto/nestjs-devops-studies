import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventNames } from '../constants/event-names.constants';
import { EmailProducer } from 'src/queues/producers/email.producer';

export interface UserRegisteredEvent {
  user: {
    id: number;
    email: string;
    name: string;
  };
  timeStamp: Date;
}

@Injectable()
export class UserRegisteredListener {
  private readonly logger = new Logger(UserRegisteredListener.name);

  constructor(private readonly emailProducer: EmailProducer) {}

  @OnEvent(EventNames.USER_REGISTERED)
  async handleUserRegistered(event: UserRegisteredEvent) {
    const { user, timeStamp } = event;

    this.logger.log(
      `Welcome, ${user.email}! Your Account was created at ${timeStamp.toISOString()}`,
    );

    await this.emailProducer.addWelcomeEmail({
      email: user.email,
      name: user.name,
    });
  }
}
