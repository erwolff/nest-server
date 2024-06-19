import { AuthServiceHelper, EmailPwUser } from '@/auth/auth-service.helper';
import { SignUpDto } from '@/auth/model';
import { ServiceError } from '@/shared/error';
import { User, UserResponse } from '@/user/model';
import { Injectable } from '@nestjs/common';
import { Err, None, Result } from '@sniptt/monads';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(private helper: AuthServiceHelper) {}

  public async login(user: EmailPwUser, res: Response): Promise<Result<UserResponse, ServiceError>> {
    return await this.helper.grantAccess(user as User, res);
  }

  public async logout(res: Response): Promise<Result<typeof None, ServiceError>> {
    return await this.helper.removeAccess(res);
  }

  public async signUp(dto: SignUpDto, res: Response): Promise<Result<UserResponse, ServiceError>> {
    const { email, password } = dto;
    return (await this.helper.validatePasswordNotExposed(password)).match({
      ok: () => this.helper.signUp(email, password, res),
      err: e => Promise.resolve(Err(e))
    });
  }

  public async validateUser(email: string, password: string): Promise<Result<EmailPwUser, ServiceError>> {
    return (await this.helper.findUserByEmail(email)).match({
      ok: user => this.helper.validateUser(user as EmailPwUser, password),
      err: e => Promise.resolve(Err(e))
    });
  }
}
