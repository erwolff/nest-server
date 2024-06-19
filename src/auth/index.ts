import { UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { EmailPwUser } from './auth-service.helper';
import { AuthUser } from './model';

export const getAuthUserIdOrThrow = (req: Request): string => {
  const id = ((req as any)?.user as AuthUser)?.id;
  if (!id) {
    throw new UnauthorizedException();
  }
  return id;
};

export const getEmailPwUserOrThrow = (req: Request): EmailPwUser => {
  const user = (req as any)?.user as EmailPwUser;
  if (!user) {
    throw new UnauthorizedException();
  }
  return user;
};
