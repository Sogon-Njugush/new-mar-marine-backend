import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Auth } from 'src/auth/entities/auth.entity';

export interface UserRegisteredEvent {
  user: {
    id: number;
    username: string;
    email: string;
  };
  timeStamp: Date;
}

@Injectable()
export class UserEventService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  //emit a user registered event
  emitUserRegisteredEvent(user: Auth): void {
    const userRegisteredEventData: UserRegisteredEvent = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      timeStamp: new Date(),
    };
    this.eventEmitter.emit('user.registered', userRegisteredEventData);
  }
}
