import { AuthRole, AuthScope } from '@/auth/model/index';

export type JwtPayload = {
  scope: AuthScope;
  roles: AuthRole[];
};
