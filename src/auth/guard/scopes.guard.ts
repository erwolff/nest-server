import { AuthScope, AuthUser } from '@/auth/model';
import { SCOPES_KEY } from '@/auth/model/auth.decorator';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes = this.reflector.getAllAndOverride<AuthScope[]>(SCOPES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (!requiredScopes) {
      return true;
    }
    // retrieve the auth-user from the request
    const { user } = context.switchToHttp().getRequest();
    const userScope = (user as AuthUser)?.scope;
    return requiredScopes.some(scope => scope == userScope);
  }
}
