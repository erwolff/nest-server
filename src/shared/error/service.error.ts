import { RetryMessageError, UnrecoverableMessageError } from '@/pubsub/model';
import { HttpError } from '@/shared/error/http.error';
import { getErrorDetails, ServiceErrorCode } from '@/shared/error/service-error.code';
import { HttpException, HttpStatus, ValidationError } from '@nestjs/common';
import { Err, None, Ok, Result } from '@sniptt/monads';

export class ServiceError {
  errorCode: ServiceErrorCode;
  statusCode?: HttpStatus;
  message?: string;
  recoverable: boolean = true;
  error: Error;

  constructor(errorCode: ServiceErrorCode) {
    this.errorCode = errorCode;
  }
}

export class ServiceErrorBuilder {
  private readonly errorCode: ServiceErrorCode;
  private status?: HttpStatus;
  private msg?: string;
  private isRecoverable: boolean = true;
  private err: Error;

  constructor(errorCode: ServiceErrorCode) {
    this.errorCode = errorCode;
  }

  public error(error: Error): ServiceErrorBuilder {
    this.err = error;
    return this;
  }

  public statusCode(statusCode: HttpStatus): ServiceErrorBuilder {
    this.status = statusCode;
    return this;
  }

  public message(message?: string): ServiceErrorBuilder {
    this.msg = message;
    return this;
  }

  public recoverable(recoverable: boolean): ServiceErrorBuilder {
    this.isRecoverable = recoverable;
    return this;
  }

  public build(): ServiceError {
    const error = new ServiceError(this.errorCode);
    error.statusCode = this.status;
    error.recoverable = this.isRecoverable;
    error.message = this.msg;
    error.error = this.err;
    return error;
  }
}

export function typedError<T>(result: Result<any, ServiceError>): Result<T, ServiceError> {
  return Err(result.unwrapErr());
}

export function serviceError<T>(errorCode: ServiceErrorCode, message?: string): Result<T, ServiceError> {
  return Err(
    new ServiceErrorBuilder(errorCode)
      .message(message)
      .build()
  );
}

export function toServiceError<T>(error: Error, code?: ServiceErrorCode): Result<T, ServiceError> {
  return Err(
    new ServiceErrorBuilder(code ? code : ServiceErrorCode.INTERNAL_SERVER_ERROR)
      .error(error)
      .message(error.message)
      .build()
  );
}

export function internalServerError<T>(message?: string): Result<T, ServiceError> {
  return Err(
    new ServiceErrorBuilder(ServiceErrorCode.INTERNAL_SERVER_ERROR)
      .message(message)
      .build()
  );
}

export function unrecoverableServiceError<T>(message: string): Result<T, ServiceError> {
  return Err(
    new ServiceErrorBuilder(ServiceErrorCode.INTERNAL_SERVER_ERROR)
      .message(message)
      .recoverable(false)
      .build()
  );
}

export function retryableServiceError<T>(message: string): Result<T, ServiceError> {
  return Err(
    new ServiceErrorBuilder(ServiceErrorCode.INTERNAL_SERVER_ERROR)
      .message(message)
      .recoverable(true)
      .build()
  );
}

export function throwHttpException(error: ServiceError): never {
  const { statusCode, message } = getErrorDetails(error.errorCode);
  const status = error.statusCode ?? statusCode;
  const msg = error.message ?? message;
  throw new HttpException({ statusCode: status, message: msg, errorCode: error.errorCode }, status);
}

export function throwValidationHttpException(error: ServiceError, errors: ValidationError[]): never {
  const { statusCode, message } = getErrorDetails(error.errorCode);
  const status = error.statusCode ?? statusCode;
  const e: HttpError = {
    statusCode: status,
    message,
    errorCode: error.errorCode,
    details: Object.assign(
      {},
      ...(errors.map(it => ({
        [it.property]: Object.values(it.constraints!)
          .join(' :: ')
          .split(`${it.property} `).join('')
      })))
    )
  };
  throw new HttpException(e, status);
}

/**
 * Helper function to allow cleaner code
 * Throws the ServiceError's associated message exception
 */
export function throwMessageException<T>(result: Result<T, ServiceError>): never {
  const error = result.unwrapErr();
  const { message } = getErrorDetails(error.errorCode);
  const errorMessage = `${message}${error.message ? ` :: ${JSON.stringify(error.message)}` : ''}`;
  if (error.recoverable) {
    throw new RetryMessageError(errorMessage);
  } else {
    throw new UnrecoverableMessageError(errorMessage);
  }
}

/**
 * Transforms the `Ok` branch of the result object into `typeof None`. For use when the success
 * case is inconsequential and only the error case matters to the caller
 */
export function emptyResult(it: Result<any, ServiceError>): Result<typeof None, ServiceError> {
  return it.match<Result<typeof None, ServiceError>>({
    ok: () => Ok(None),
    err: e => Err(e)
  });
}

export function errMsg(result: Result<any, ServiceError>): string {
  return result.isErr() ? result.unwrapErr().message ?? '' : '';
}
