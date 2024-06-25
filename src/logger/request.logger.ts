import { AuthUser } from '@/auth/model';
import { NestServerLogger } from '@/logger/nest-server.logger';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import _ from 'lodash';

// noinspection JSUnresolvedReference
@Injectable()
export class RequestLogger implements NestMiddleware {
  constructor(private readonly logger: NestServerLogger) {
    this.logger.setContext('Router');
  }

  public use(request: Request, response: Response, next: NextFunction): void {
    const startTime = process.hrtime();
    const { ip, method, originalUrl } = request;
    const userAgent = request.get('user-agent') || '';
    const path = originalUrl.split('?')[0];

    response.on('finish', () => {
      const { statusCode } = response;
      const contentLength = response.get('content-length');
      const endTime = process.hrtime(startTime);
      const responseTime = Math.trunc(endTime[0] * 1e3 + endTime[1] * 1e-6);
      const details = this.parseDetails(request, path);
      this.logger.log(
        `${method} ${path} ${statusCode} ${contentLength ?? '0'} `
          + `${responseTime}ms ${userAgent} ${ip}${_.isEmpty(details) ? '' : ` -${details}`}`
      );
    });

    next();
  }

  private parseDetails(request: Request, path: string): string {
    const userId = ((request as any)?.user as AuthUser)?.id;
    return ''.concat(`${userId ? ` user: ${userId}` : ''}`)
      .concat(_.isEmpty(request.query) ? `` : ` query: ${JSON.stringify(request.query)}`)
      .concat(this.getSanitizedBody(request, path));
  }

  private getSanitizedBody(request: Request, path: string): string {
    if (_.isEmpty(request.body) || _.includes(path, 'webhook')) {
      return ``;
    }
    // do not log passwords
    return ` body: ${_.replace(JSON.stringify(request.body), /"password":"(.+?)"/i, '"password":"********"')}`;
  }
}
