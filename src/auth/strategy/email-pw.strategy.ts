import { EmailPwUser } from '@/auth/auth-service.helper';
import { AuthService } from '@/auth/auth.service';
import { throwHttpException } from '@/shared/error';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

@Injectable()
export class EmailPwStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<EmailPwUser> {
    return (await this.authService.validateUser(email, password)).match({
      ok: _ => _,
      err: e => throwHttpException(e)
    });
  }
}
