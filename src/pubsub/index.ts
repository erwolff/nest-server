import { RetryMessageError } from '@/pubsub/model';
import { ServiceError, throwMessageException } from '@/shared/error';
import { Err, None, Result } from '@sniptt/monads';

/**
 * Common pattern which uses the cache to dedupe messages consumed
 * from a queue in order to ensure idempotency
 *
 * @param processFn
 * @param cacheSetFn
 * @param cacheDelFn
 */
export async function dedupeAndProcess(
  processFn: () => Promise<Result<typeof None, ServiceError>>,
  cacheSetFn: () => Promise<boolean>,
  cacheDelFn: () => Promise<void>
) {
  // call cacheSetFn to ensure we can process this item
  if (await cacheSetFn()) {
    // process this item
    try {
      (await processFn()).match({
        ok: _ => _,
        err: e => {
          // check if a recoverable error was thrown
          if (e.recoverable) {
            // error is recoverable, delete from the cache so we can retry
            cacheDelFn();
          }
          // throw the error
          throwMessageException(Err(e));
        }
      });
    } catch (e) {
      if (e instanceof RetryMessageError) {
        // error is recoverable, delete from cache so we can retry
        await cacheDelFn();
      }
      // rethrow the error
      throw e;
    }
  }
}
