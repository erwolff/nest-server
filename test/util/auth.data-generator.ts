import { LoginDto, SignUpDto } from '@/auth/model';
import { _email, _password } from './data.generator';

export const _signUpDto = (set?: Partial<SignUpDto>): SignUpDto =>
  Object.assign(new SignUpDto(), {
    email: _email(),
    password: _password(),
    ...set
  });

export const _loginDto = (set?: Partial<LoginDto>): LoginDto =>
  Object.assign(new LoginDto(), {
    email: _email(),
    password: _password(),
    ...set
  });
