import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    const { method, url, body, params, query } = request;
    const userAgent = request.get('user-agent') ?? 'Unknown';

    const user = request.user as { id?: number | string } | undefined;
    const userId = user?.id ?? 'Unauthenticated';

    const startTime = Date.now();

    this.logger.log({
      method,
      url,
      body,
      params,
      query,
      userAgent,
      userId,
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          this.logger.log({
            method,
            url,
            userId,
            response: data,
            duration: Date.now() - startTime,
          });
        },
        error: (err) => {
          this.logger.error({
            method,
            url,
            userId,
            error: err,
          });
        },
      }),
    );
  }
}
