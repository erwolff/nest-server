import { AuthController } from '@/auth/auth.controller';
import { AuthService } from '@/auth/auth.service';
import { UserResponse } from '@/user/model';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Err, None, Ok } from '@sniptt/monads';
import { Request, Response } from 'express';
import { _loginDto, _signUpDto } from '../../util/auth.data-generator';
import { defaultHttpException, defaultServiceError } from '../../util/data.generator';
import { _user } from '../../util/user.data-generator';

describe('AuthController', () => {
  let controller: AuthController;
  let service: DeepMocked<AuthService>;

  beforeEach(async () => {
    const testModule = await Test.createTestingModule({ providers: [AuthController] })
      .useMocker(createMock)
      .compile();

    controller = testModule.get(AuthController);
    service = testModule.get(AuthService);
  });

  describe('signUp', () => {
    it('returns UserResponse on ok from service', async () => {
      const dto = _signUpDto();
      const user = _user({ email: dto.email });
      const expected = new UserResponse(user);
      service.signUp.mockResolvedValue(Ok(expected));
      await expect(controller.signUp(dto, createMock<Response>())).resolves.toEqual(expected);
    });

    it('throws on err from service', async () => {
      const dto = _signUpDto();
      service.signUp.mockResolvedValue(Err(defaultServiceError));
      await expect(controller.signUp(dto, createMock<Response>())).rejects.toMatchObject(defaultHttpException);
    });
  });

  describe('login', () => {
    it('returns UserResponse on login', async () => {
      const dto = _loginDto();
      const user = _user({ email: dto.email });
      const req = createMock<Request>();
      req.user = user;
      const expected = new UserResponse(user);
      service.login.mockResolvedValue(Ok(expected));
      await expect(controller.login(req, createMock<Response>())).resolves.toEqual(expected);
    });

    it('throws when req does not contain a user', async () => {
      const req = createMock<Request>();
      req.user = undefined;
      await expect(controller.login(req, createMock<Response>())).rejects.toMatchObject(new UnauthorizedException());
    });

    it('throws on err from service', async () => {
      const dto = _loginDto();
      const user = _user({ email: dto.email });
      const req = createMock<Request>();
      req.user = user;
      service.login.mockResolvedValue(Err(defaultServiceError));
      await expect(controller.login(req, createMock<Response>())).rejects.toMatchObject(defaultHttpException);
    });
  });

  describe('logout', () => {
    it('does not throw on ok from service', async () => {
      const user = _user();
      const req = createMock<Request>();
      req.user = user;
      service.logout.mockResolvedValue(Ok(None));
      await expect(controller.logout(req, createMock<Response>())).toResolve();
    });

    it('throws when req does not contain a user', async () => {
      const req = createMock<Request>();
      req.user = undefined;
      await expect(controller.logout(req, createMock<Response>())).rejects.toMatchObject(new UnauthorizedException());
    });

    it('throws on err from service', async () => {
      const user = _user();
      const req = createMock<Request>();
      req.user = user;
      service.logout.mockResolvedValue(Err(defaultServiceError));
      await expect(controller.logout(req, createMock<Response>())).rejects.toMatchObject(defaultHttpException);
    });
  });
});
