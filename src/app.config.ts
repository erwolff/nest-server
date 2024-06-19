import { Environment } from '@/config';
import { NestServerLogger } from '@/logger/nest-server.logger';
import { ServiceError, ServiceErrorCode, throwValidationHttpException } from '@/shared/error';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, raw, text, urlencoded } from 'body-parser';
import cookieParser from 'cookie-parser';

/**
 * Configures the nest application. Used by tests as well
 * to ensure the prod app matches the test app
 *
 * @param app
 */
export function configureApp(app: INestApplication): void {
  configureLogs(app);
  configureBodyParser(app);
  configureCookies(app);
  configureCors(app);
  configureValidation(app);
  configureSwagger(app);
}

function configureLogs(app: INestApplication): void {
  app.useLogger(new NestServerLogger());
}

function configureBodyParser(app: INestApplication): void {
  app.use(json({ limit: '50mb' }));
  app.use(raw({ limit: '50mb' }));
  app.use(text({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
}

function configureCookies(app: INestApplication): void {
  app.use(cookieParser());
}

function configureCors(app: INestApplication): void {
  const corsAllowList = app.get(ConfigService).get<Array<string>>('cors.allowList');
  if (corsAllowList?.length) {
    app.enableCors({ origin: corsAllowList, credentials: true });
  }
}

function configureValidation(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: errors =>
        throwValidationHttpException(new ServiceError(ServiceErrorCode.VALIDATION_FAILED), errors)
    })
  );
}

function configureSwagger(app: INestApplication): void {
  if (app.get(ConfigService).getOrThrow('env') === Environment.PRODUCTION) {
    return;
  }
  const config = new DocumentBuilder()
    .setTitle('Nest Server')
    .setDescription(`back-end server built using the [nest.js](https://github.com/nestjs/nest) framework`)
    .setVersion('0.0.1')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/docs', app, document, {
    swaggerOptions: {
      supportedSubmitMethods: []
    }
  });
}
