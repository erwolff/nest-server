import { NestServerLogger } from '@/logger/nest-server.logger';
import { Module } from '@nestjs/common';

@Module({
  providers: [NestServerLogger],
  exports: [NestServerLogger]
})
export class LoggerModule {}
