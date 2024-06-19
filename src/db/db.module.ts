import { TypegooseModule } from '@m8a/nestjs-typegoose';
import { Module, ModuleMetadata } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pager } from '@/db/pager';

export const dbModuleMetadata: ModuleMetadata = {
  imports: [
    TypegooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow('db.uri')
      })
    })
  ],
  providers: [Pager],
  exports: [Pager]
};

@Module(dbModuleMetadata)
export class DbModule {}
