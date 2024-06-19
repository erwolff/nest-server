import { getAuthUserIdOrThrow, getEmailPwUserOrThrow } from '@/auth/';
import { AuthService } from '@/auth/auth.service';
import { EmailPwGuard } from '@/auth/guard';
import { LoginDto, Public, Secure, SignUpDto } from '@/auth/model';
import { ServiceErrorCode, throwHttpException } from '@/shared/error';
import { UserResponse } from '@/user/model';
import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ApiRoute } from '@/shared/swagger';

@ApiTags('auth')
@Controller('/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Post('/sign-up')
  @ApiRoute('Sign-up a new user', {
    success: {
      status: HttpStatus.CREATED,
      type: UserResponse,
      description: 'The newly created user'
    },
    errors: [ServiceErrorCode.AUTH_DUPLICATE_EMAIL, ServiceErrorCode.AUTH_PASSWORD_EXPOSED]
  })
  public async signUp(
    @Body() dto: SignUpDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<UserResponse> {
    return (await this.authService.signUp(dto, res)).match({
      ok: _ => _,
      err: e => throwHttpException(e)
    });
  }

  @Secure({ guards: [EmailPwGuard] })
  @HttpCode(HttpStatus.OK)
  @Post('/login')
  @ApiRoute('Authenticate a user with email/password', {
    success: {
      status: HttpStatus.OK,
      type: UserResponse,
      description: 'The currently logged in user'
    },
    errors: [ServiceErrorCode.AUTH_INVALID_EMAIL_OR_PW]
  })
  @ApiBody({ type: LoginDto })
  public async login(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<UserResponse> {
    const user = getEmailPwUserOrThrow(req);
    return (await this.authService.login(user, res)).match({
      ok: _ => _,
      err: e => throwHttpException(e)
    });
  }

  @Secure()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('/logout')
  @ApiRoute('Log the user out', {
    secure: true,
    success: {
      status: HttpStatus.NO_CONTENT,
      description: 'The user has been successfully logged out'
    }
  })
  public async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<void> {
    getAuthUserIdOrThrow(req);
    (await this.authService.logout(res)).match({
      ok: _ => _,
      err: e => throwHttpException(e)
    });
  }
}
