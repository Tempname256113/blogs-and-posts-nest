import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { validationPipeExceptionFactory } from './app-configuration/pipes/validation-pipe.exception-factory';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: validationPipeExceptionFactory,
    }),
  );
  await app.listen(3000);
}
bootstrap();
