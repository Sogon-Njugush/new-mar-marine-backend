import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { UserRegisteredEvent } from '../user-event.service';

@Injectable()
export class UserRegisteredListener {
  private readonly logger = new Logger(UserRegisteredListener.name);

  @OnEvent('user.registered')
  handleUserRegisteredEvent(event: UserRegisteredEvent): void {
    const { user, timeStamp } = event;
    //send mail / verify email
    this.logger.log(
      `Welcome: ${user.username}! Your account was created at ${timeStamp}`,
    );
  }
}
