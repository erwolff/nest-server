import { AwsSqsProvider } from '@/aws/aws-sqs.provider';
import { ConsumerRegistrar } from '@/pubsub/consumer.registrar';
import { SqsQueue } from '@/pubsub/model';
import { SqsQueueRegistrar } from '@/pubsub/sqs-queue.registrar';
import { internalServerError, ServiceError } from '@/shared/error';
import { SendMessageCommandOutput } from '@aws-sdk/client-sqs';
import { Injectable } from '@nestjs/common';
import { Ok, Result } from '@sniptt/monads';
import { NestServerLogger } from '@/logger/nest-server.logger';

export const MAX_PUBLISH_DELAY = 900; // 900 seconds (15mins) is the max supported

@Injectable()
export class PubSubService {
  constructor(
    private readonly logger: NestServerLogger,
    private sqs: AwsSqsProvider,
    private queueRegistrar: SqsQueueRegistrar,
    private consumerRegistrar: ConsumerRegistrar
  ) {
    this.logger.setContext(PubSubService.name);
  }

  /**
   * Publishes the supplied message to the supplied SQS queue
   *
   * @param queue
   * @param message
   * @param options
   */
  public async publish<T>(
    queue: SqsQueue<T>,
    message: T,
    options?: PublishMessageOptions
  ): Promise<Result<SendMessageCommandOutput, ServiceError>> {
    try {
      const command = this.sqs.sendMessageCommand(queue.name, message, options);
      return Ok(await this.sqs.getClient().send(command));
    } catch (e) {
      this.logger.error(`Error publishing message to queue ${queue.name}: ${e}`);
      return internalServerError(e.message);
    }
  }

  public async registerQueues(queues: SqsQueue<any>[]): Promise<void> {
    await Promise.all(queues.map(async queue => {
      await this.registerQueue(queue);
    }));
  }

  /**
   * Registers a queue:
   * - Creates the queue (and its DLQ) if it does not already exist
   * - Subscribes the specified consumers to the queue
   *
   * @param queue
   */
  public async registerQueue<T>(queue: SqsQueue<T>): Promise<Result<string, ServiceError>> {
    try {
      const registerResult = await this.queueRegistrar.registerQueue(queue);
      if (registerResult.isErr()) {
        return registerResult;
      }
      return this.consumerRegistrar.subscribeConsumers(queue, registerResult.unwrap());
    } catch (e) {
      this.logger.error(`Unsuccessful registering queue ${queue.name} and its consumers: ${e}`);
      return internalServerError(e.message);
    }
  }
}

export interface PublishMessageOptions {
  delaySeconds?: number;
  dedupeId?: string;
}
