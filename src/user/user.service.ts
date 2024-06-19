import { NestServerLogger } from '@/logger/nest-server.logger';
import { errMsg, internalServerError, ServiceError, serviceError, ServiceErrorCode } from '@/shared/error';
import { UserResponse } from '@/user/model/';
import { UserRepository } from '@/user/user.repository';
import { Injectable } from '@nestjs/common';
import { Ok, Result } from '@sniptt/monads';

@Injectable()
export class UserService {
  constructor(
    private readonly logger: NestServerLogger,
    private readonly userRepo: UserRepository
  ) {
    this.logger.setContext(UserService.name);
  }

  public async getSelf(userId: string): Promise<Result<UserResponse, ServiceError>> {
    const result = await this.userRepo.findById(userId);
    if (result.isErr()) {
      this.logger.error(`Error when finding user by id: ${errMsg(result)}`);
      return internalServerError();
    }
    return result.unwrap().match({
      some: user => Ok(new UserResponse(user)),
      none: () => serviceError(ServiceErrorCode.USER_NOT_FOUND)
    });
  }
}
