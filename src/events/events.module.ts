import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UserRegisteredListener } from './listeners/user-registered.listener';
import { QueuesModule } from 'src/queues/queues.module';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      global: true,
      wildcard: false,
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),
    QueuesModule,
  ],
  providers: [UserRegisteredListener],
  exports: [],
})
export class EventsModule {}
