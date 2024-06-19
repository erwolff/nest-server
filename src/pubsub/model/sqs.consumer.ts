// noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected

import { QueueAttributeName } from '@aws-sdk/client-sqs';

/**
 * Definition of a consumer attached to an SQS queue
 */
export abstract class SqsConsumer<MESSAGE_TYPE> {
  public options: SqsConsumerOptions;

  constructor(options: SqsConsumerOptions = {}) {
    this.options = options;
  }

  /**
   * Required:
   *  Called for each message consumed from this queue
   *
   * @param message
   */
  public abstract onMessage(message: MESSAGE_TYPE): Promise<void>;

  /**
   * Optional:
   * Override this function if retry logic differs from standard
   * onMessage logic
   *
   * @param message
   * @param retryCount
   */
  public async onRetry(message: MESSAGE_TYPE, retryCount: number): Promise<void> {
    return await this.onMessage(message);
  }

  /**
   * Optional:
   * Called when error occurs interacting with the queue
   *
   * Note:
   * Logging already occurs (see: sqsConsumerRegistrar#createConsumer),
   * only write an implementation if an action needs to be taken
   */
  public onError?(err: Error): void;

  /**
   * Optional:
   * Called when error occurs processing the message
   *
   * Note:
   * Logging already occurs (see: sqsConsumerRegistrar#createConsumer),
   * only write an implementation if an action needs to be taken
   */
  public onProcessingError?(err: Error): void;

  /**
   * Optional:
   * Called when handleMessageTimeoutMs has been exceeded for this message
   *
   * Note:
   * Logging already occurs (see: sqsConsumerRegistrar#createConsumer),
   * only write an implementation if an action needs to be taken
   */
  public onTimeoutError?(err: Error): void;
}

/**
 * Options for customizing consumer behavior
 * See https://github.com/bbc/sqs-consumer for more info on usage
 */
export interface SqsConsumerOptions {
  attributeNames?: QueueAttributeName[];
  messageAttributeNames?: string[];
  visibilityTimeoutSeconds?: number;
  handleMessageTimeoutMs?: number;
  waitTimeSeconds?: number;
  authenticationErrorTimeoutMs?: number;
  pollingWaitTimeMs?: number;
  terminateVisibilityTimeout?: boolean;
  heartbeatIntervalSeconds?: number;
}

export const sqsConsumerDefaults: SqsConsumerOptions = {
  /**
   * handleMessageTimeoutMs: the amount of time (in millis) that the consumer has to
   * process the message before it throws a timeout_error is thrown (triggering
   * the sqsConsumer#onTimeoutError function)
   *
   * Default: 10000 ms (10 seconds)
   */
  handleMessageTimeoutMs: 10 * 1000,

  /**
   * visibilityTimeoutMs: the amount of time a message will remain "hidden" from consumers
   * when being retried. The visibility timeout does not affect new messages, only those
   * being retried. E.g. if a message is placed back on the queue to be retried, no
   * consumer will process it for [visibilityTimeoutMs] millis - effectively creating a
   * back-off policy
   *
   * Default: 30000 ms (30 seconds)
   */
  visibilityTimeoutSeconds: 30 * 1000,

  /**
   * attributeNames: which SQS attributes to include in the message's Attributes
   * metadata.
   *
   * Reference: https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_Message.html
   */
  messageAttributeNames: ['ApproximateReceiveCount', 'MessageDeduplicationId']
};
