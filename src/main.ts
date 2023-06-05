import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { validationPipeExceptionFactoryFunction } from '../generic-pipes/validation-pipe.exception-factory-function';
import cookieParser from 'cookie-parser';
import { useContainer } from 'class-validator';
import morgan from 'morgan';

morgan.token('body', (req) => {
  //@ts-ignore
  return JSON.stringify(req.body);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(morgan(':method :url :status :body'));
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.enableCors();
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: validationPipeExceptionFactoryFunction,
    }),
  );
  await app.listen(3000);
}
bootstrap();
