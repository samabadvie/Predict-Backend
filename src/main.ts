import { ClassSerializerInterceptor } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import compression from 'compression';
import { TransformInterceptor } from 'core/interceptors';
import { express as useragent } from 'express-useragent';
import basicAuth from 'express-basic-auth';
import {
  BadRequestExceptionFilter,
  // EntityNotFoundErrorFilter,
  FlowExceptionFilter,
  GlobalExceptionFilter,
  NotFoundExceptionFilter,
  QueryFailedErrorFilter,
  UnauthorizedExceptionFilter,
  ValidationExceptionFilter,
} from 'core/filters';
import { ValidationPipe } from 'core/pipes';
import { configService } from 'core/config.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConflictExceptionFilter } from './core/filters';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true });
  app.useStaticAssets(join(__dirname, '../assets'));
  app.use(express.static(__dirname + 'assets'));
  app.use('/', express.static('../assets'));

  app.enableCors();

  app.use(compression(), useragent());

  app.setGlobalPrefix('api');

  app.useGlobalInterceptors(new TransformInterceptor(), new ClassSerializerInterceptor(app.get(Reflector)));

  app.useGlobalFilters(
    new FlowExceptionFilter(),
    new ConflictExceptionFilter(),
    new GlobalExceptionFilter(),
    new QueryFailedErrorFilter(),
    new NotFoundExceptionFilter(),
    new ValidationExceptionFilter(),
    new BadRequestExceptionFilter(),
    // new EntityNotFoundErrorFilter(),
    new UnauthorizedExceptionFilter(),
  );

  app.use(
    '/docs',
    basicAuth({
      challenge: true,
      users: {
        admin: "ktzc'Wm$84VJ{KY#",
      },
    }),
  );

  app.useGlobalPipes(new ValidationPipe());

  if (configService.getSwaggerEnabled()) {
    const config = new DocumentBuilder()
      .setTitle('Predict Backend')
      .setDescription('Predict backend API documentation')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', in: 'docs', name: 'Authorization', bearerFormat: 'jwt' })
      .addApiKey({ type: 'apiKey', name: 'X-Api-Key', in: 'header' }, 'X-Api-Key')
      .build();
    const document = SwaggerModule.createDocument(app, config, {
      ...configService.getExtraModels(),
    });
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(configService.getHTTPAddress());
}
bootstrap();
