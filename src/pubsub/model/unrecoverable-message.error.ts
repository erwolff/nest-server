/**
 * Throw when processing a message within a consumer pipeline that
 * can/should not be processed. When caught, the message will be sent
 * to the dead-letter queue
 */
export class UnrecoverableMessageError extends Error {
  constructor(message: string) {
    super(message);
  }
}
