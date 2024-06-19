import { CacheModule as CachingModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-ioredis-yet';

@Module({
  imports: [
    CachingModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const uri = new URL(configService.getOrThrow('cache.uri'));
        const { hostname, port, username, password } = uri;
        return {
          store: await redisStore(
            { host: hostname, port: Number(port), username, password }
          )
        };
      }
    })
  ],
  exports: [CachingModule]
})
export class CacheModule {}
