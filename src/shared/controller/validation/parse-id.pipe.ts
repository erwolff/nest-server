import { ServiceError, ServiceErrorCode, throwValidationHttpException } from '@/shared/error';
import { Injectable, PipeTransform, ValidationError } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class ParseIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!Types.ObjectId.isValid(value)) {
      throwValidationHttpException(new ServiceError(ServiceErrorCode.VALIDATION_FAILED), [{
        property: 'id',
        constraints: { id: 'must be a bson object id' }
      } as ValidationError]);
    }
    return value;
  }
}
