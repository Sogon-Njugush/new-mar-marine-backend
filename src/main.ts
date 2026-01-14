import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { Logger, ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  //logger
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });
  // Apply Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove all fields that are not in the DTO
      forbidNonWhitelisted: true, // Throw an error if a field is not in the DTO
      transform: true, // Transform the data to the DTO
      disableErrorMessages: false, // Disable error messages
    }),
  );

  // Apply Global Interceptor (Success formatting)
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Apply Global Filter (Error formatting)
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter)); // Pass the dependency here

  // Apply Global Prefix
  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
