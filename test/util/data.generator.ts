import { PageDto } from '@/shared/controller/model';
import { ServiceError, ServiceErrorCode } from '@/shared/error';
import casual from 'casual';
import * as crypto from 'crypto';
import { Types } from 'mongoose';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 21);

export const expectedError = new Error('✅ expected');
export const defaultHttpException = {
  response: {
    statusCode: 500,
    message: 'An internal server error occurred, please try again later',
    errorCode: 'internal_server_error'
  }
};
export const defaultServiceError = new ServiceError(ServiceErrorCode.INTERNAL_SERVER_ERROR);

export const randomInt = (min = 0, max = Number.MAX_SAFE_INTEGER): number => crypto.randomInt(min, max);
export const randomHex = (chars = 10): string => crypto.randomBytes(chars / 2).toString('hex');
export const randomHexNumber = (max = Number.MAX_SAFE_INTEGER): string => randomInt(0, max).toString(16);

export const _id = (): Types.ObjectId => new Types.ObjectId();
export const _idString = (): string => _id().toHexString();
export const _email = (): string => casual.email.toLowerCase();
export const _password = (): string => casual.password;

export const _pageDto = (set?: Partial<PageDto>): PageDto =>
  Object.assign(new PageDto(1, 20, 'desc'), {
    ...set
  });
