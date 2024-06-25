import { AuthServiceHelper, EmailPwUser } from '@/auth/auth-service.helper';
import { AuthTokenService } from '@/auth/auth-token.service';
import { ServiceErrorBuilder, ServiceErrorCode } from '@/shared/error';
import { UserResponse } from '@/user/model';
import { UserRepository } from '@/user/user.repository';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { Err, None, Ok, Some } from '@sniptt/monads';
import { Response } from 'express';
import { _email, _idString, _password, defaultServiceError } from '../../util/data.generator';
import { _user } from '../../util/user.data-generator';

describe('AuthServiceHelper', () => {
  let helper: AuthServiceHelper;
  let userRepo: DeepMocked<UserRepository>;
  let authTokenService: DeepMocked<AuthTokenService>;

  beforeEach(async () => {
    const testModule = await Test.createTestingModule({ providers: [AuthServiceHelper] })
      .useMocker(createMock)
      .compile();

    helper = testModule.get(AuthServiceHelper);
    userRepo = testModule.get(UserRepository);
    authTokenService = testModule.get(AuthTokenService);
  });

  describe('grantAccess', () => {
    it('calls authTokenService.generateAndSetJwtCookie and returns a UserResponse on success', async () => {
      const user = _user();
      const expected = new UserResponse(user);
      const result = await helper.grantAccess(user, createMock<Response>());
      expect(result.isOk()).toBeTrue();
      expect(result.unwrap()).toEqual(expected);
      expect(authTokenService.generateAndSetJwtCookie).toHaveBeenCalled();
    });

    it('returns INTERNAL_SERVER_ERROR when authTokenService.generateAndSetJwtCookie throws', async () => {
      const user = _user();
      authTokenService.generateAndSetJwtCookie.mockRejectedValue(defaultServiceError);
      const result = await helper.grantAccess(user, createMock<Response>());
      expect(result.isErr()).toBeTrue();
      expect(result.unwrapErr().errorCode).toEqual(ServiceErrorCode.INTERNAL_SERVER_ERROR);
    });
  });

  describe('revokeAccess', () => {
    it('calls authTokenService.clearAuthCookies', async () => {
      const result = await helper.revokeAccess(createMock<Response>());
      expect(result.isOk()).toBeTrue();
      expect(authTokenService.clearAuthCookies).toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('returns user when validatePassword is true', async () => {
      const user = { id: _idString(), email: _email(), password: _password() } as EmailPwUser;
      jest.spyOn(helper as any, 'validatePassword').mockResolvedValue(Ok(true));
      const result = await helper.validateUser(user, _password());
      expect(result.isOk()).toBeTrue();
      expect(result.unwrap()).toEqual(user);
    });

    it('returns AUTH_INVALID_EMAIL_OR_PW when validatePassword is false', async () => {
      const user = { id: _idString(), email: _email(), password: _password() } as EmailPwUser;
      jest.spyOn(helper as any, 'validatePassword').mockResolvedValue(Ok(false));
      const result = await helper.validateUser(user, _password());
      expect(result.isErr()).toBeTrue();
      expect(result.unwrapErr().errorCode).toEqual(ServiceErrorCode.AUTH_INVALID_EMAIL_OR_PW);
    });

    it('returns INTERNAL_SERVER_ERROR when validatePassword errors', async () => {
      const user = { id: _idString(), email: _email(), password: _password() } as EmailPwUser;
      jest.spyOn(helper as any, 'validatePassword').mockResolvedValue(Err(defaultServiceError));
      const result = await helper.validateUser(user, _password());
      expect(result.isErr()).toBeTrue();
      expect(result.unwrapErr().errorCode).toEqual(ServiceErrorCode.INTERNAL_SERVER_ERROR);
    });
  });

  describe('signUp', () => {
    it('returns UserResponse on success', async () => {
      const user = _user();
      jest.spyOn(helper as any, 'createUser').mockResolvedValue(Ok(user));
      const result = await helper.signUp(user.email, user.password, createMock<Response>());
      expect(result.isOk()).toBeTrue();
      expect(result.unwrap()).toEqual(new UserResponse(user));
      expect(authTokenService.generateAndSetJwtCookie).toHaveBeenCalled();
    });

    it('returns err when createUser fails', async () => {
      jest.spyOn(helper as any, 'createUser').mockResolvedValue(Err(defaultServiceError));
      const result = await helper.signUp(_email(), _password(), createMock<Response>());
      expect(result.isErr()).toBeTrue();
      expect(result.unwrapErr().errorCode).toEqual(ServiceErrorCode.INTERNAL_SERVER_ERROR);
    });
  });

  describe('findUserByEmail', () => {
    it('returns User when found', async () => {
      const email = _email();
      const user = _user({ email });
      userRepo.findOne.mockResolvedValue(Ok(Some(user)));
      const actual = await helper.findUserByEmail(email);
      expect(actual.isOk()).toEqual(true);
      expect(actual.unwrap()).toEqual(user);
    });

    it('returns AUTH_INVALID_EMAIL_OR_PW when user not found', async () => {
      userRepo.findOne.mockResolvedValue(Ok(None));
      const result = await helper.findUserByEmail(_email());
      expect(result.isErr()).toBeTrue();
      expect(result.unwrapErr().errorCode).toEqual(ServiceErrorCode.AUTH_INVALID_EMAIL_OR_PW);
    });

    it('returns INTERNAL_SERVER_ERROR when userRepo returns error', async () => {
      userRepo.findOne.mockResolvedValue(Err(defaultServiceError));
      const result = await helper.findUserByEmail(_email());
      expect(result.isErr()).toBeTrue();
      expect(result.unwrapErr().errorCode).toEqual(ServiceErrorCode.INTERNAL_SERVER_ERROR);
    });
  });

  describe('createUser', () => {
    it('returns User when created', async () => {
      const email = _email();
      const password = _password();
      const user = _user({ email, password });
      userRepo.save.mockResolvedValue(Ok(user));
      const actual = await helper.createUser(email, password);
      expect(actual.isOk()).toEqual(true);
      expect(actual.unwrap()).toEqual(user);
    });

    it('returns AUTH_DUPLICATE_EMAIL on duplicateKeyError', async () => {
      const email = _email();
      const password = _password();
      userRepo.save.mockResolvedValue(
        Err(
          new ServiceErrorBuilder(ServiceErrorCode.INTERNAL_SERVER_ERROR)
            .error({ code: 11000 } as any)
            .build()
        )
      );
      const result = await helper.createUser(email, password);
      expect(result.isErr()).toBeTrue();
      expect(result.unwrapErr().errorCode).toEqual(ServiceErrorCode.AUTH_DUPLICATE_EMAIL);
    });

    it('returns INTERNAL_SERVER_ERROR when userRepo returns error', async () => {
      const email = _email();
      const password = _password();
      userRepo.save.mockResolvedValue(Err(defaultServiceError));
      const result = await helper.createUser(email, password);
      expect(result.isErr()).toBeTrue();
      expect(result.unwrapErr().errorCode).toEqual(ServiceErrorCode.INTERNAL_SERVER_ERROR);
    });
  });
});
