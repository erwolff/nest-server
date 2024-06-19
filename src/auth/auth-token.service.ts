import { AuthRole, AuthScope, JwtPayload } from '@/auth/model';
import { Environment } from '@/config';
import { nanoid } from '@/shared/util';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import crypto from 'crypto';
import { CookieOptions, Response } from 'express';
import ms from 'ms';

export const jwtCookieName = 'NEST_SERVER_AUTH';
export const scopeCookieName = 'NEST_SERVER_AUTH_SCOPE';

@Injectable()
export class AuthTokenService {
  private readonly domain: string;
  private readonly principal: string;
  private readonly secure: boolean;
  private readonly accessTokenSecret: string;
  private readonly jwtExpiresInMs: number;
  private readonly csrfTokenSecret: string;

  constructor(configService: ConfigService, private jwtService: JwtService) {
    this.accessTokenSecret = configService.getOrThrow('auth.jwtSecret');
    this.jwtExpiresInMs = ms(configService.getOrThrow<string>('auth.jwtExpiresIn'));
    this.csrfTokenSecret = configService.getOrThrow('auth.csrfTokenSecret');
    this.domain = configService.getOrThrow('auth.domain');
    this.principal = `${this.domain == 'localhost' ? 'http' : 'https'}://${this.domain}`;
    this.secure = configService.getOrThrow('env') === Environment.PRODUCTION;
  }

  public async generateAndSetJwtCookie(
    res: Response,
    userId: string,
    scope: AuthScope,
    roles?: AuthRole[]
  ): Promise<void> {
    const jwt = await this.generateJwt(userId, scope, roles);
    this.setAuthCookies(jwt, scope, res);
  }

  public generateCsrfToken(jwt: string): string {
    const hmac = crypto.createHmac('sha256', this.csrfTokenSecret);
    hmac.update(jwt);
    return hmac.digest('hex');
  }

  private async generateJwt(userId: string, scope: AuthScope, roles?: AuthRole[]): Promise<string> {
    return await this.jwtService.signAsync(
      this.getJwtPayload(scope, roles),
      this.getJwtRegisteredClaims(userId)
    );
  }

  private setAuthCookies(jwt: string, scope: AuthScope, res: Response): void {
    const expires = new Date();
    expires.setMilliseconds(expires.getMilliseconds() + this.jwtExpiresInMs);
    // set an httponly cookie with the jwt
    res.cookie(jwtCookieName, jwt, this.getJwtCookieOptions(expires));
    // set a cookie which the front-end can use to check the current auth scope
    res.cookie(scopeCookieName, scope, this.getScopeCookieOptions(expires));
  }

  /**
   * Clears the Jwt from the supplied
   * response's cookies
   *
   * Note: we must provide the exact same
   * options in order for browsers to clear
   * the cookie properly
   */
  public clearAuthCookies(res: Response) {
    // clear the jwt cookie
    res.clearCookie(jwtCookieName, this.getJwtCookieOptions());
    // clear the scope cookie
    res.clearCookie(scopeCookieName, this.getScopeCookieOptions());
  }

  private getJwtCookieOptions(expires?: Date): CookieOptions {
    return {
      domain: this.domain,
      secure: this.secure,
      path: '/',
      httpOnly: true,
      sameSite: this.secure ? 'none' : undefined,
      expires
    };
  }

  private getScopeCookieOptions(expires?: Date): CookieOptions {
    return {
      domain: this.domain,
      secure: this.secure,
      path: '/',
      sameSite: this.secure ? 'none' : undefined,
      expires
    };
  }

  private getJwtPayload(scope: AuthScope, roles?: AuthRole[]): JwtPayload {
    return {
      scope,
      roles: roles ?? [AuthRole.USER]
    };
  }

  private getJwtRegisteredClaims(userId: string): JwtSignOptions {
    return {
      secret: this.accessTokenSecret,
      expiresIn: /* seconds */ (this.jwtExpiresInMs / 1000),
      audience: this.principal,
      issuer: this.principal,
      jwtid: nanoid(),
      subject: userId
    };
  }
}
