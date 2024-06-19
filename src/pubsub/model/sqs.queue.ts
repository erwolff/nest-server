import { SqsConsumer } from '@/pubsub/model';
import { PubSubService } from '@/pubsub/pub-sub.service';
import { Inject, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import _ from 'lodash';

/**
 * Represents the definition of an AWS SQS Queue.
 * Registers the queue and its consumers onModuleInit
 */
export abstract class SqsQueue<MESSAGE_TYPE> implements OnModuleInit {
  public name: string;
  public consumer: SqsConsumer<MESSAGE_TYPE>;
  public options: SqsQueueOptions;

  @Inject()
  protected configService: ConfigService;

  @Inject()
  protected pubSubService: PubSubService;

  protected constructor(queueName: string, consumer: SqsConsumer<MESSAGE_TYPE>, options: SqsQueueOptions = {}) {
    this.name = queueName;
    this.consumer = consumer;
    this.options = options;
  }

  async onModuleInit() {
    const suffix = this.configService.get('aws.env');
    this.name = this.name.concat(_.isEmpty(suffix) ? '' : `-${suffix}`);
    await this.pubSubService.registerQueue(this);
  }
}

export interface SqsQueueOptions {
  /**
   * [Optional] The number of consumers attached to the
   * queue per node
   *
   * default: process.env.AWS_SQS_DEFAULT_CONSUMER_COUNT
   */
  consumerCount?: number;

  /**
   * [Optional] The number of times the message will be
   * redelivered to the queue before being placed
   * on the dead-letter queue
   *
   * default: process.env.AWS_SQS_DEFAULT_MAX_RECEIVE_COUNT
   */
  maxReceiveCount?: number;

  /**
   * [Optional] The number of seconds that every message
   * should be delayed prior to being visible to the consumers.
   *
   * default: 0
   */
  delaySeconds?: number;
}
