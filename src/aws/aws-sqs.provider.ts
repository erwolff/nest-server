import { PublishMessageOptions } from '@/pubsub/pub-sub.service';
import {
  CreateQueueCommand,
  DeleteMessageCommand,
  GetQueueAttributesCommand,
  GetQueueUrlCommand,
  SendMessageCommand,
  SQSClient
} from '@aws-sdk/client-sqs';
import { AwsCredentialIdentity } from '@aws-sdk/types/dist-types/identity/AwsCredentialIdentity';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AwsSqsProvider {
  private readonly client: SQSClient;
  private readonly defaultMaxReceiveCount: number;
  private registeredQueues: { [queueName: string]: string } = {};

  constructor(configService: ConfigService) {
    this.client = new SQSClient({
      region: configService.getOrThrow('aws.region'),
      endpoint: configService.getOrThrow('aws.sqs.uri'),
      credentials: {
        accessKeyId: configService.getOrThrow('aws.accessKeyId'),
        secretAccessKey: configService.getOrThrow('aws.secretAccessKey')
      } as AwsCredentialIdentity
    });
    this.defaultMaxReceiveCount = configService.get<number>('aws.sqs.defaults.maxReceiveCount') || 5;
  }

  public getClient(): SQSClient {
    return this.client;
  }

  public getQueueUrlCommand(queueName: string): GetQueueUrlCommand {
    return new GetQueueUrlCommand({
      QueueName: queueName
    });
  }

  public addRegisteredQueue(queueName: string, queueUrl: string) {
    this.registeredQueues[queueName] = queueUrl;
  }

  public getQueueArnCommand(queueUrl: string): GetQueueAttributesCommand {
    return new GetQueueAttributesCommand({
      QueueUrl: queueUrl,
      AttributeNames: ['QueueArn']
    });
  }

  public createQueueCommand(queueName: string, attributes?: Record<string, string>): CreateQueueCommand {
    return new CreateQueueCommand({
      QueueName: queueName,
      Attributes: attributes
    });
  }

  public sendMessageCommand(queueName: string, message: any, options?: PublishMessageOptions): SendMessageCommand {
    return new SendMessageCommand({
      MessageBody: JSON.stringify(message),
      DelaySeconds: options?.delaySeconds,
      MessageDeduplicationId: options?.dedupeId,
      QueueUrl: this.registeredQueues[queueName]
    });
  }

  public deleteMessageCommand(queueName: string, messageReceiptHandle: string): DeleteMessageCommand {
    return new DeleteMessageCommand({
      ReceiptHandle: messageReceiptHandle,
      QueueUrl: this.registeredQueues[queueName]
    });
  }

  /**
   * Returns the Attributes to assign this queue
   *
   * @param deadLetterQueueArn
   * @param maxReceiveCount
   */
  public redrivePolicy(deadLetterQueueArn: string, maxReceiveCount?: number): Record<string, string> {
    return {
      RedrivePolicy: JSON.stringify({
        deadLetterTargetArn: deadLetterQueueArn,
        maxReceiveCount: maxReceiveCount?.toString() ?? this.defaultMaxReceiveCount.toString()
      })
    };
  }
}
