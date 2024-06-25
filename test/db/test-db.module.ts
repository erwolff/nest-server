import { Pager } from '@/db/pager';
import { TypegooseModule } from '@m8a/nestjs-typegoose';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypegooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        // append '-test' to the db name so we don't delete local data
        uri: configService.getOrThrow<string>('db.uri').indexOf('?') > 0
          ? configService.getOrThrow<string>('db.uri').replace('?', '-test?')
          : configService.getOrThrow<string>('db.uri').concat('-test')
      })
    })
  ],
  providers: [Pager],
  exports: [Pager]
})
export class TestDbModule {}
