import { getErrorDetails, HttpError, ServiceErrorCode } from '@/shared/error';
import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiResponseMetadata,
  ApiResponseOptions,
  getSchemaPath
} from '@nestjs/swagger';
import _ from 'lodash';
import { PageResponse } from '@/shared/controller/model';

export type ApiRouteDef = {
  secure?: boolean;
  admin?: boolean;
  pageable?: boolean;
  success: ApiResponseOptions;
  errors?: ServiceErrorCode[];
};

/**
 * Meta-decorator which condenses all of swagger's required decorators down into a
 * single well-structured entity. Ensures controller route code stays clean
 */
export function ApiRoute(description: string, def: ApiRouteDef) {
  const { admin, secure, pageable, success, errors } = def;
  const decorators = [ApiOperation({ summary: admin ? '**ADMIN**' : undefined, description })];
  if (secure) {
    decorators.push(ApiCookieAuth());
  }
  if (pageable) {
    decorators.push(ApiPageResponse(success as ApiResponseMetadata));
  } else {
    decorators.push(ApiResponse(success));
  }
  if (errors) {
    decorators.push(...generateErrors(errors).map(error => ApiResponse(error)));
  }
  return applyDecorators(...decorators);
}

function generateErrors(errorCodes: ServiceErrorCode[]): ApiResponseOptions[] {
  const errorsByStatus: Record<number, HttpError[]> = {};
  for (const errorCode of errorCodes) {
    const errorInfo = getErrorDetails(errorCode);
    const status = errorInfo.statusCode;
    const error = {
      statusCode: status,
      errorCode: errorCode,
      message: errorInfo.message
    } as HttpError;
    if (errorsByStatus[status]) {
      errorsByStatus[status].push(error);
    } else {
      errorsByStatus[status] = [error];
    }
  }
  return _.keys(errorsByStatus).map(status => {
    const errors = errorsByStatus[status];
    return {
      status,
      schema: {
        example: errors.length == 1 ? errors[0] : errors
      }
    } as ApiResponseOptions;
  });
}

export const ApiPageResponse = (response: ApiResponseMetadata) =>
  applyDecorators(
    ApiExtraModels(PageResponse, response.type as Type),
    ApiOkResponse({
      description: response.description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(PageResponse) },
          {
            properties: {
              content: {
                type: 'array',
                items: { $ref: getSchemaPath(response.type as Type) }
              }
            }
          }
        ]
      }
    })
  );
