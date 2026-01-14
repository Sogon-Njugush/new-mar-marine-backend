import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerException, ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const email = req.body?.email || 'anonymous';
    return `login:${email}`;
  }

  //set throttle limit
  protected getLimit(): Promise<number> {
    return Promise.resolve(3);
  }

  //set throttle ttl
  protected getTTL(): Promise<number> {
    return Promise.resolve(60000);
  }

  protected async throwThrottlingException(): Promise<void> {
    throw new ThrottlerException(
      `Too many requests. Please try again later after 1 minute.`,
    );
  }
}
