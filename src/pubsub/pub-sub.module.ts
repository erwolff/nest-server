import { AwsModule } from '@/aws/aws.module';
import { LoggerModule } from '@/logger/logger.module';
import { ConsumerRegistrar } from '@/pubsub/consumer.registrar';
import { PubSubService } from '@/pubsub/pub-sub.service';
import { SqsQueueRegistrar } from '@/pubsub/sqs-queue.registrar';
import { Module, ModuleMetadata } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

export const pubSubModuleMetadata: ModuleMetadata = {
  imports: [AwsModule, ConfigModule, LoggerModule],
  providers: [
    PubSubService,
    SqsQueueRegistrar,
    ConsumerRegistrar
  ],
  exports: [PubSubService]
};

@Module(pubSubModuleMetadata)
export class PubSubModule {
}
