import { jwtCookieName } from '@/auth/auth-token.service';
import { AuthUser } from '@/auth/model';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const domain = configService.getOrThrow('auth.domain');
    const principal = `${domain == 'localhost' ? 'http' : 'https'}://${domain}`;
    super({
      jwtFromRequest: extractJwt,
      issuer: principal,
      audience: principal,
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('auth.jwtSecret')
    });
  }

  // TODO: we could check if this userId exists in a cache containing
  //  expired tokens (recently deleted users) and throw
  //  UnauthorizedException if found
  async validate(payload: any): Promise<AuthUser> {
    return {
      id: payload.sub,
      scope: payload.scope,
      roles: payload.roles
    } as AuthUser;
  }
}

/**
 * Extracts the jwt from the request's cookies
 */
const extractJwt = (req: Request): string | null => req?.cookies ? req.cookies[jwtCookieName] : null;
