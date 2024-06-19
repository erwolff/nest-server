import { AwsSqsProvider } from '@/aws/aws-sqs.provider';
import { Module, ModuleMetadata } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

export const awsModuleMetadata: ModuleMetadata = {
  imports: [ConfigModule],
  providers: [AwsSqsProvider],
  exports: [AwsSqsProvider]
};

@Module(awsModuleMetadata)
export class AwsModule {}
