import { HttpStatus } from '@nestjs/common';

export enum ServiceErrorCode {
  INTERNAL_SERVER_ERROR = 'internal_server_error',

  /**
   * Validation
   */
  VALIDATION_FAILED = 'validation_failed',

  /**
   * Auth
   */
  AUTH_DUPLICATE_EMAIL = 'auth_duplicate_email',
  AUTH_INVALID_EMAIL_OR_PW = 'auth_invalid_email_or_pw',
  AUTH_PASSWORD_EXPOSED = 'auth_password_exposed',

  /**
   * Movie
   */
  MOVIE_ALREADY_EXISTS = 'movie_already_exists',
  MOVIE_NOT_FOUND = 'movie_not_found',

  /**
   * User
   */
  USER_EMAIL_ALREADY_EXISTS = 'user_email_already_exists',
  USER_NOT_FOUND = 'user_not_found',

  /**
   * Misc
   */
  EXTERNAL_REQUEST_FAILED = 'external_request_failed',
  ENTITY_ALREADY_EXISTS = 'entity_already_exists',

  /**
   * Internal
   */
  QUEUE_NOT_FOUND = 'queue_not_found'
}

type ServiceErrorDetails = {
  statusCode: HttpStatus;
  message: string;
  recoverable?: boolean;
};

const errors: Record<ServiceErrorCode, ServiceErrorDetails> = {
  [ServiceErrorCode.INTERNAL_SERVER_ERROR]: {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'An internal server error occurred, please try again later'
  },

  /**
   * Validation
   */
  [ServiceErrorCode.VALIDATION_FAILED]: {
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'Request failed validation - see details'
  },

  /**
   * Auth
   */
  [ServiceErrorCode.AUTH_DUPLICATE_EMAIL]: {
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'A user with that email already exists'
  },
  [ServiceErrorCode.AUTH_INVALID_EMAIL_OR_PW]: {
    statusCode: HttpStatus.UNAUTHORIZED,
    message: 'Invalid email or password'
  },
  [ServiceErrorCode.AUTH_PASSWORD_EXPOSED]: {
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'Password has potentially been exposed in a data breach'
  },

  /**
   * Movie
   */
  [ServiceErrorCode.MOVIE_ALREADY_EXISTS]: {
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'A movie with this title already exists'
  },
  [ServiceErrorCode.MOVIE_NOT_FOUND]: {
    statusCode: HttpStatus.NOT_FOUND,
    message: 'No movie exists with that id'
  },

  /**
   * User
   */
  [ServiceErrorCode.USER_EMAIL_ALREADY_EXISTS]: {
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'A user with this email already exists'
  },
  [ServiceErrorCode.USER_NOT_FOUND]: {
    statusCode: HttpStatus.NOT_FOUND,
    message: 'No user exists with that id'
  },

  /**
   * Misc
   */
  [ServiceErrorCode.EXTERNAL_REQUEST_FAILED]: {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'Request to external service failed - please try again later'
  },
  [ServiceErrorCode.ENTITY_ALREADY_EXISTS]: {
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'An entity with these unique properties already exists'
  },

  /**
   * Internal
   */
  [ServiceErrorCode.QUEUE_NOT_FOUND]: {
    statusCode: HttpStatus.NOT_FOUND,
    message: 'Queue not found'
  }
};

export function getErrorDetails(errorCode: ServiceErrorCode): ServiceErrorDetails {
  return errors[errorCode];
}
