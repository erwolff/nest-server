import { AwsSqsProvider } from '@/aws/aws-sqs.provider';
import { Environment } from '@/config';
import { RetryMessageError, sqsConsumerDefaults, SqsQueue, UnrecoverableMessageError } from '@/pubsub/model';
import { deadLetter } from '@/pubsub/sqs-queue.registrar';
import { internalServerError, ServiceError, unrecoverableServiceError } from '@/shared/error';
import { Message } from '@aws-sdk/client-sqs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ok, Result } from '@sniptt/monads';
import { Consumer } from 'sqs-consumer';
import { NestServerLogger } from '@/logger/nest-server.logger';

@Injectable()
export class ConsumerRegistrar {
  private readonly defaultConsumerCount: number;
  private registeredConsumers: Array<Consumer> = [];

  constructor(
    private readonly logger: NestServerLogger,
    private sqs: AwsSqsProvider,
    private configService: ConfigService
  ) {
    this.logger.setContext(ConsumerRegistrar.name);
    this.defaultConsumerCount = this.configService.get<number>('aws.sqs.defaults.consumerCount') || 1;
  }

  /**
   * Subscribes the specified number of consumers to the supplied queue
   */
  public subscribeConsumers<T>(queue: SqsQueue<T>, queueUrl: string): Result<string, ServiceError> {
    this.logger.log(`Subscribing consumer(s) to queue: ${queue.name}`);
    for (let i = 0; i < (queue.options.consumerCount ?? this.defaultConsumerCount); i++) {
      try {
        const consumer = this.createConsumer(queue, queueUrl);
        if (this.configService.getOrThrow('env') !== Environment.TEST) {
          consumer.start();
        }
        /* if (this.configService.getOrThrow('env') === Environment.TEST) {
          this.registeredConsumers.push(consumer);
        } */
      } catch (e) {
        this.logger.error(`Error creating consumer ${i} for queue ${queue.name}: ${e}`);
        return internalServerError(e.message);
      }
    }
    return Ok(queueUrl);
  }

  /**
   * Creates the queue's consumer object with all required logic and error handling
   */
  public createConsumer<T>(queue: SqsQueue<T>, queueUrl: string): Consumer {
    const options = queue.consumer.options;
    return (
      Consumer.create({
        sqs: this.sqs.getClient(),
        queueUrl: queueUrl,
        attributeNames: options.attributeNames ?? sqsConsumerDefaults.attributeNames,
        messageAttributeNames: options.messageAttributeNames,
        visibilityTimeout: options.visibilityTimeoutSeconds,
        handleMessageTimeout: options.handleMessageTimeoutMs ?? sqsConsumerDefaults.handleMessageTimeoutMs,
        // tests need a low wait time in order to be able to disconnect quickly
        waitTimeSeconds: this.configService.get('env') === Environment.TEST ? 1 : options.waitTimeSeconds,
        authenticationErrorTimeout: options.authenticationErrorTimeoutMs,
        pollingWaitTimeMs: options.pollingWaitTimeMs,
        terminateVisibilityTimeout: options.terminateVisibilityTimeout,
        heartbeatInterval: options.heartbeatIntervalSeconds,
        handleMessage: this.handleMessage(queue)
      })
        // fired when error occurs interacting with the queue
        .on('error', async e => {
          await this.handleQueueError(e, queue);
        })
        // fired when error occurs processing the message
        .on('processing_error', async (e, message) => {
          await this.handleMessageProcessingError(e, queue, message);
        })
        // fired when handleMessageTimeoutMs has been exceeded for this message
        .on('timeout_error', async (e, message) => {
          await this.handleMessageTimeoutError(e, queue, message);
        })
    );
  }

  /**
   * Returns the function to be applied to any SQSMessage received by this consumer
   * - Deserializes the message's body into the supplied type (<T>)
   * - Calls the consumer's onMessage function with the deserialized body
   *
   * Note: If consumer.onMessage returns a rejected promise, the message will be retried
   * after the consumer's visibilityTimeoutMs has expired
   *
   * @param queue
   */
  public handleMessage<T>(queue: SqsQueue<T>): (sqsMessage: Message) => Promise<any> {
    const consumer = queue.consumer;
    return async (sqsMessage: Message) => {
      // TODO: use a cache to dedupe sqsMessage.Attributes.MessageDeduplicationId? (sqs doesn't guarantee single-delivery)
      if (sqsMessage && sqsMessage.Body) {
        const parseResult = this.parseMessage(sqsMessage, queue);
        if (parseResult.isOk()) {
          const message = parseResult.unwrap();
          const receiveCount = this.getReceiveCount(sqsMessage);
          if (receiveCount > 1) {
            // this message has been received by a consumer before - call onRetry
            this.logger.log(`Retrying message ${JSON.stringify(message)} from queue ${queue.name}`);
            await consumer.onRetry(message, receiveCount);
          }
          // this is the first time the message has been received - call on Message
          await consumer.onMessage(message);
        }
      } else {
        this.logger.error(`Received SQSMessage with invalid format: ${sqsMessage}`);
      }
    };
  }

  public getReceiveCount(sqsMessage: Message): number {
    return sqsMessage && sqsMessage.Attributes ? Number(sqsMessage.Attributes.ApproximateReceiveCount) : 1;
  }

  private async handleQueueError(e: Error, queue: SqsQueue<any>): Promise<void> {
    this.logger.error(`Error triggered by queue ${queue.name}: ${e.message}`);
    if (queue.consumer.onError) queue.consumer.onError(e);
  }

  private async handleMessageProcessingError(e: Error, queue: SqsQueue<any>, message: Message): Promise<void> {
    if (e instanceof RetryMessageError) {
      this.logger.warn(
        `Retry error thrown when processing message ${message?.Body} from queue ${queue.name}${
          parseRetryErrorMessage(e.message)
        } - message will be retried`
      );
    } else if (e instanceof UnrecoverableMessageError) {
      this.logger.error(
        `Unrecoverable error thrown when processing message ${message?.Body} from queue ${queue.name}${
          parseRetryErrorMessage(e.message)
        } - message will be sent to the dead-letter queue`
      );
      await this.sendMessageToDLQ(queue, message);
    } else {
      this.logger.error(
        `Error processing message ${message?.Body} from queue ${queue.name}: ${e.message}: ${e.stack}`
      );
      if (queue.consumer.onProcessingError) queue.consumer.onProcessingError(e);
    }
  }

  private async handleMessageTimeoutError(e: Error, queue: SqsQueue<any>, message: Message): Promise<void> {
    this.logger.error(`Timeout error while processing message ${message?.Body} from queue ${queue.name}: ${e.message}`);
    if (queue.consumer.onTimeoutError) queue.consumer.onTimeoutError(e);
  }

  private async sendMessageToDLQ(queue: SqsQueue<any>, message: Message): Promise<void> {
    try {
      if (message.ReceiptHandle) {
        // send this message to the DLQ
        await this.sqs.getClient().send(this.sqs.sendMessageCommand(deadLetter(queue.name), message));
        // delete this message from its current queue
        await this.sqs.getClient().send(this.sqs.deleteMessageCommand(queue.name, message.ReceiptHandle));
      }
    } catch (e) {
      this.logger.error(
        `Unable to move message to DLQ - message will be retried and moved automatically after attempts are exhausted: ${e}`
      );
    }
  }

  private parseMessage<T>(sqsMessage: Message, queue: SqsQueue<T>): Result<T, ServiceError> {
    try {
      const body = sqsMessage.Body ? JSON.parse(sqsMessage.Body) : '{}';
      return Ok(body as T);
    } catch (err) {
      const msg = `Error deserializing message from queue: ${queue.name}: ${err}`;
      this.logger.error(msg);
      return unrecoverableServiceError(msg);
    }
  }

  /**
   * Used exclusively by tests in order to sever the connections
   * of all consumers (so that jest can exit properly)
   * @private - so that only tests can access it
   */
  private async disconnectAll(): Promise<void> {
    this.registeredConsumers.forEach(consumer => {
      consumer.stop();
    });
  }
}

const parseRetryErrorMessage = (message: string): string => {
  if (!message) return '';
  return message.replace('Unexpected message handler failure', '');
};
