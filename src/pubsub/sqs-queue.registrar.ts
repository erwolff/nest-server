import { AwsSqsProvider } from '@/aws/aws-sqs.provider';
import { SqsQueue } from '@/pubsub/model';
import { internalServerError, ServiceError, serviceError, ServiceErrorCode } from '@/shared/error';
import { Injectable } from '@nestjs/common';
import { Err, Ok, Result } from '@sniptt/monads';
import { NestServerLogger } from '@/logger/nest-server.logger';

const queueDoesNotExistErrorCode = 'AWS.SimpleQueueService.NonExistentQueue';
const queueAlreadyExistsError = 'AWS.SimpleQueueService.QueueAlreadyExists';

/**
 * Transform function which converts a queueName to its dead-letter counterpart
 * - exported for tests
 *
 * @param queueName
 */
export const deadLetter = (queueName: string) => queueName + '-dl';

@Injectable()
export class SqsQueueRegistrar {
  constructor(private readonly logger: NestServerLogger, private sqs: AwsSqsProvider) {
    this.logger.setContext(SqsQueueRegistrar.name);
  }

  /**
   * Registers the supplied SQS queue:
   * - Creates it and a DLQ counterpart if not exists
   * - If exists, simply returns the queue url
   *
   * @param queue
   */
  public async registerQueue<T>(queue: SqsQueue<T>): Promise<Result<string, ServiceError>> {
    let result = await this.getQueueUrl(queue.name);
    if (this.queueDoesNotExist(result)) {
      result = await this.createQueue(queue);
    }
    if (result.isOk()) {
      // add this queue's url to our registered queues
      this.sqs.addRegisteredQueue(queue.name, result.unwrap());
      // attempt to add the dlq's url to our registered queues as well (nbd if this fails)
      const dlqResult = await this.getQueueUrl(deadLetter(queue.name));
      if (dlqResult.isOk()) {
        this.sqs.addRegisteredQueue(deadLetter(queue.name), dlqResult.unwrap());
      }
    }
    return result;
  }

  /**
   * Attempts to retrieve the url of the supplied queue name
   *
   * @param queueName
   */
  private async getQueueUrl(queueName: string): Promise<Result<string, ServiceError>> {
    try {
      const command = this.sqs.getQueueUrlCommand(queueName);
      const response = await this.sqs.getClient().send(command);
      return response?.QueueUrl
        ? Ok(response.QueueUrl)
        : serviceError(ServiceErrorCode.QUEUE_NOT_FOUND, `Queue '${queueName}' does not exist`);
    } catch (e) {
      if (e?.Error?.Code === queueDoesNotExistErrorCode) {
        return serviceError(ServiceErrorCode.QUEUE_NOT_FOUND, `Queue '${queueName}' does not exist`);
      }
      this.logger.error(`Unable to retrieve url for queue: ${queueName}${e ? ': ' + e.message : ''}`);
      return internalServerError(e.message);
    }
  }

  /**
   * Attempts to retrieve the ARN of the queue at the supplied url
   *
   * @param queueUrl
   */
  private async getQueueArn(queueUrl: string): Promise<Result<string, ServiceError>> {
    try {
      const command = this.sqs.getQueueArnCommand(queueUrl);
      const response = await this.sqs.getClient().send(command);
      return response?.Attributes?.QueueArn
        ? Ok(response.Attributes.QueueArn)
        : serviceError(ServiceErrorCode.QUEUE_NOT_FOUND, `No queue found with url: ${queueUrl}`);
    } catch (e) {
      this.logger.error(`Error retrieving queue ARN for queue: ${queueUrl}${e ? ': ' + e.message : ''}`);
      return internalServerError(e.message);
    }
  }

  private queueDoesNotExist(getQueueUrlResult: Result<string, ServiceError>) {
    return getQueueUrlResult.isErr() && getQueueUrlResult.unwrapErr().errorCode === ServiceErrorCode.QUEUE_NOT_FOUND;
  }

  /**
   * Attempts to create the supplied queue (and DLQ) in AWS
   * - First attempts to create a DLQ for this queue
   * - Next retrieves the ARN of the DLQ and uses it to create this queue
   *
   * - If creating the DLQ fails due to it already existing, attempts
   *      to still proceed with queue creation
   *
   * @param queue
   */
  private async createQueue<T>(queue: SqsQueue<T>): Promise<Result<string, ServiceError>> {
    // first we need to create the DLQ for this queue so we can set its ARN on the new queue
    return (await this.doCreateQueue(deadLetter(queue.name))).match({
      ok: url => this.getDlqArnAndCreateQueue(url, queue),
      err: e => Promise.resolve(Err(e))
    });
  }

  /**
   * Wrapper around the sqs.createQueue call to allow for easy unit testing
   *
   * @param queueName
   * @param attributes
   */
  private async doCreateQueue(
    queueName: string,
    attributes?: Record<string, string>
  ): Promise<Result<string, ServiceError>> {
    try {
      const command = this.sqs.createQueueCommand(queueName, attributes);
      const response = await this.sqs.getClient().send(command);
      if (!response?.QueueUrl) {
        return internalServerError(`Response from aws did not contain QueueUrl: ${JSON.stringify(response)}`);
      }
      this.logger.log(`Successfully created new queue: ${response.QueueUrl}`);
      return Ok(response.QueueUrl);
    } catch (e) {
      // check if the error indicates that the queue already exists
      if (e?.Error?.Code === queueAlreadyExistsError) {
        // the queue already exists just return its url
        this.logger.log(`Queue: ${queueName} already exists`);
        return this.getQueueUrl(queueName);
      }
      this.logger.error(`Unable to create queue: ${queueName}${e ? ': ' + e.message : ''}`);
      return internalServerError(e.message);
    }
  }

  /**
   * Attempts to retrieve the ARN of the DLQ with the supplied url, then creates a new queue
   * with its DeadLetterARN pointed to the retrieved ARN
   *
   * @param deadLetterQueueUrl
   * @param queue
   */
  private async getDlqArnAndCreateQueue<T>(
    deadLetterQueueUrl: string,
    queue: SqsQueue<T>
  ): Promise<Result<string, ServiceError>> {
    return (await this.getQueueArn(deadLetterQueueUrl)).match({
      ok: arn => this.doCreateQueue(queue.name, this.generateQueueAttributes(queue, arn)),
      err: e => Promise.resolve(Err(e))
    });
  }

  private generateQueueAttributes(queue: SqsQueue<any>, arn: string): Record<string, string> {
    const attributes = this.sqs.redrivePolicy(arn, queue.options.maxReceiveCount);
    if (queue.options.delaySeconds) {
      attributes[`DelaySeconds`] = `${queue.options.delaySeconds}`;
    }
    return attributes;
  }
}
