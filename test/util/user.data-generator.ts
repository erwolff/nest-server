import { AuthRole } from '@/auth/model';
import { User } from '@/user/model';
import { _email, _id, _password } from './data.generator';

export const _user = (set?: Partial<User>): User =>
  Object.assign(new User(), {
    _id: _id(),
    email: _email(),
    password: _password(),
    roles: [AuthRole.USER],
    ...set
  });
