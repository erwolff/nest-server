import { getAuthUserIdOrThrow } from '@/auth';
import { Secure } from '@/auth/model';
import { throwHttpException } from '@/shared/error';
import { ApiRoute } from '@/shared/swagger';
import { UserResponse } from '@/user/model';
import { UserService } from '@/user/user.service';
import { Controller, Get, HttpStatus, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@Controller('/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Secure()
  @Get('/me')
  @ApiRoute('Get the details of the currently logged in user', {
    secure: true,
    success: {
      status: HttpStatus.OK,
      type: UserResponse,
      description: 'The currently logged in user'
    }
  })
  public async getSelf(
    @Req() req: Request
  ): Promise<UserResponse> {
    const id = getAuthUserIdOrThrow(req);
    return (await this.userService.getSelf(id)).match({
      ok: _ => _,
      err: e => throwHttpException(e)
    });
  }
}
