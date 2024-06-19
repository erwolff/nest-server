import { AuthRole, AuthUser } from '@/auth/model';
import { ROLES_KEY } from '@/auth/model/auth.decorator';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AuthRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    const userRoles = (user as AuthUser)?.roles;
    return userRoles?.includes(AuthRole.ADMIN) || requiredRoles.some(role => userRoles?.includes(role));
  }
}
