import { AuthTokenService } from '@/auth/auth-token.service';
import { AuthRole, AuthScope } from '@/auth/model';
import { duplicateKeyErrorCode } from '@/db';
import { NestServerLogger } from '@/logger/nest-server.logger';
import {
  errMsg,
  internalServerError,
  ServiceError,
  serviceError,
  ServiceErrorCode,
  toServiceError,
  typedError
} from '@/shared/error';
import { User, UserResponse } from '@/user/model';
import { UserRepository } from '@/user/user.repository';
import { Injectable } from '@nestjs/common';
import { None, Ok, Result } from '@sniptt/monads';
import bcrypt from 'bcrypt';
import { Response } from 'express';
import { pwnedPassword } from 'hibp';

export type EmailPwUser = Required<Pick<User, 'id' | 'email' | 'password'>>;

@Injectable()
export class AuthServiceHelper {
  constructor(
    private readonly logger: NestServerLogger,
    private readonly userRepo: UserRepository,
    private readonly authTokenService: AuthTokenService
  ) {
    this.logger.setContext(AuthServiceHelper.name);
  }

  public async grantAccess(
    user: User,
    res: Response
  ): Promise<Result<UserResponse, ServiceError>> {
    try {
      await this.authTokenService.generateAndSetJwtCookie(res, user.id, AuthScope.AUTHENTICATED, user.roles);
      return Ok(new UserResponse(user));
    } catch (e) {
      this.logger.error(`Error when generating jwt for user ${user.id}: ${e}`);
      return internalServerError();
    }
  }

  public async revokeAccess(res: Response): Promise<Result<typeof None, ServiceError>> {
    this.authTokenService.clearAuthCookies(res);
    return Ok(None);
  }

  public async validateUser(
    user: EmailPwUser,
    password: string
  ): Promise<Result<EmailPwUser, ServiceError>> {
    const result = await this.validatePassword(password, user.password);
    if (result.isErr()) {
      return internalServerError();
    }
    const validPassword = result.unwrap();
    if (!validPassword) {
      return serviceError(ServiceErrorCode.AUTH_INVALID_EMAIL_OR_PW);
    }
    return Ok(user);
  }

  public async signUp(
    email: string,
    password: string,
    res: Response
  ): Promise<Result<UserResponse, ServiceError>> {
    const result = await this.createUser(email, password);
    if (result.isErr()) {
      return typedError(result);
    }
    const user = result.unwrap();
    await this.authTokenService.generateAndSetJwtCookie(res, user.id, AuthScope.AUTHENTICATED, user.roles);
    return Ok(new UserResponse(user));
  }

  public async findUserByEmail(email: string): Promise<Result<User, ServiceError>> {
    const result = await this.userRepo.findOne({ email });
    if (result.isErr()) {
      this.logger.error(`Error when finding user by email ${email}: ${errMsg(result)}`);
      return internalServerError();
    }
    return result.unwrap().match({
      some: user => Ok(user),
      none: () => serviceError(ServiceErrorCode.AUTH_INVALID_EMAIL_OR_PW)
    });
  }

  public async validatePasswordNotExposed(password: string): Promise<Result<typeof None, ServiceError>> {
    try {
      const secure = !(await pwnedPassword(password));
      return secure
        ? Ok(None)
        : serviceError(ServiceErrorCode.AUTH_PASSWORD_EXPOSED);
    } catch (e) {
      this.logger.error(`Error when checking if password has been exposed: ${e}`);
      return internalServerError();
    }
  }

  public async createUser(email: string, password: string): Promise<Result<User, ServiceError>> {
    const hashResult = await this.hashPassword(password);
    if (hashResult.isErr()) {
      this.logger.error(`Error when hashing password for user with email ${email}`);
      return internalServerError();
    }
    const saveResult = await this.userRepo.save({
      email,
      password: hashResult.unwrap(),
      roles: [AuthRole.USER]
    } as User);
    if (saveResult.isErr()) {
      if (this.isDuplicateKeyError(saveResult.unwrapErr())) {
        return serviceError(ServiceErrorCode.AUTH_DUPLICATE_EMAIL);
      }
      this.logger.error(`Error when saving user: ${saveResult.unwrapErr().message}`);
      return internalServerError();
    }
    return Ok(saveResult.unwrap());
  }

  private async validatePassword(pwFromReq: string, hashedPwFromDb: string): Promise<Result<boolean, ServiceError>> {
    try {
      const result = await bcrypt.compare(pwFromReq, hashedPwFromDb);
      return Ok(result);
    } catch (e) {
      return toServiceError(e);
    }
  }

  private async hashPassword(password: string): Promise<Result<string, ServiceError>> {
    try {
      const result = await bcrypt.hash(password, 10);
      return Ok(result);
    } catch (e) {
      return toServiceError(e);
    }
  }

  private isDuplicateKeyError(serviceError: ServiceError): boolean {
    return (serviceError.error as any)?.code === duplicateKeyErrorCode;
  }
}
