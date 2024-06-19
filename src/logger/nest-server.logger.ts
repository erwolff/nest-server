import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class NestServerLogger extends ConsoleLogger {
  constructor() {
    super();
  }
}
