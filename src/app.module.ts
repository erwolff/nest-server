import { AuthModule } from '@/auth/auth.module';
import { AwsModule } from '@/aws/aws.module';
import { CacheModule } from '@/cache/cache.module';
import config from '@/config';
import { DbModule } from '@/db/db.module';
import { LoggerModule } from '@/logger/logger.module';
import { MovieModule } from '@/movie/movie.module';
import { PubSubModule } from '@/pubsub/pub-sub.module';
import { UserModule } from '@/user/user.module';
import { MiddlewareConsumer, Module, ModuleMetadata, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

export const appModuleMetadata: ModuleMetadata = {
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config]
    }),
    AuthModule,
    AwsModule,
    CacheModule,
    DbModule,
    LoggerModule,
    MovieModule,
    PubSubModule,
    UserModule
  ]
};

@Module(appModuleMetadata)
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // consumer.apply(RequestLogger).forRoutes('*');
  }
}
