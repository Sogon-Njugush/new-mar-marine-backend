import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost) {
    // In certain edge cases, httpAdapter might not be available
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal Server Error' };

    // --- LOGIC TO HANDLE VALIDATION ERRORS ---

    let errorMessage: string | string[];

    // If the response is an object (standard NestJS validation error structure)
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as any;

      // NestJS puts validation messages in 'message' property
      if (responseObj.message) {
        errorMessage = responseObj.message;
      } else {
        errorMessage = JSON.stringify(responseObj);
      }
    } else {
      // It's just a string error
      errorMessage = exceptionResponse as string;
    }

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
      // Always ensure "error" is consistent.
      // If it's an array (validation), we keep it as an array.
      error: errorMessage,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
