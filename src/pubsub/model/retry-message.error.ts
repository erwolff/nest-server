/**
 * Throw a new RetryMessageError in order to intentionally
 * retry a message received by a consumer
 */
export class RetryMessageError extends Error {
  constructor(message: string) {
    super(message);
  }
}
