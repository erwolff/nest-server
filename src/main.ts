// noinspection JSIgnoredPromiseFromCall

import { configureApp } from '@/app.config';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { NestServerLogger } from '@/logger/nest-server.logger';

require('module-alias/register.js');

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // buffer the logs during startup so we can log out init events using our custom logger
    bufferLogs: true
  });
  // trust the reverse proxy's X-Forwarded-For address as the client's ip
  app.set('trust proxy', true);
  configureApp(app);
  await app.listen(app.get(ConfigService).getOrThrow<number>('api.port'), 'localhost');
  (await app.resolve(NestServerLogger)).log(
    `🚀 Nest Server has launched at ${(await app.getUrl())?.replace('[::1]', '127.0.0.1')}`,
    'Server'
  );
}

/**
 * app entry-point
 */
bootstrap();
