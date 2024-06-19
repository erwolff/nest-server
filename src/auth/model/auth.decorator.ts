/* eslint-disable @typescript-eslint/ban-types */
import { JwtGuard } from '@/auth/guard';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { ScopesGuard } from '@/auth/guard/scopes.guard';
import { applyDecorators, CanActivate, SetMetadata, UseGuards } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const SCOPES_KEY = 'scopes';

export enum AuthScope {
  /**
   * The user is fully authenticated
   */
  AUTHENTICATED = 'authenticated',

  /**
   * The user must perform mfa verification
   */
  // MFA_REQUIRED = 'mfa',

  /**
   * The user must perform email verification
   */
  // EMAIL_VERIFICATION_REQUIRED = 'email'
}

export enum AuthRole {
  ADMIN = 'admin',
  USER = 'user'
}

/**
 * Default auth properties for each endpoint marked with @Secure
 * that doesn't specify its own requirements
 */
const defaultGuards = [JwtGuard, ScopesGuard, RolesGuard];
const defaultScopes = [AuthScope.AUTHENTICATED];
const defaultRoles = [AuthRole.USER];

/**
 * Meta-decorator which ensures the proper ordering of guards
 * is applied while also providing standard defaults for
 * secured routes
 *
 * @param options
 * @constructor
 */
export function Secure(options?: AuthOptions) {
  return applyDecorators(
    SetMetadata(SCOPES_KEY, options?.scopes ?? defaultScopes),
    SetMetadata(ROLES_KEY, options?.roles ?? defaultRoles),
    UseGuards(...(options?.guards ?? defaultGuards))
  );
}

export interface AuthOptions {
  guards?: (CanActivate | Function)[];
  roles?: AuthRole[];
  scopes?: AuthScope[];
}
