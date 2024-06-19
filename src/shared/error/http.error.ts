import { ServiceErrorCode } from '@/shared/error/service-error.code';
import { HttpStatus } from '@nestjs/common';

export type HttpError = {
  statusCode: HttpStatus;
  message: string;
  errorCode: ServiceErrorCode;
  details?: Record<string, string>;
};
