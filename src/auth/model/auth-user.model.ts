import { AuthRole, AuthScope } from '@/auth/model/index';

export type AuthUser = {
  id: string;
  scope: AuthScope;
  roles: AuthRole[];
};
