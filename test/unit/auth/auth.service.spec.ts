import { AuthServiceHelper } from '@/auth/auth-service.helper';
import { AuthService } from '@/auth/auth.service';
import { UserResponse } from '@/user/model';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { Err, None, Ok } from '@sniptt/monads';
import { Response } from 'express';
import { _signUpDto } from '../../util/auth.data-generator';
import { _email, _password, defaultServiceError } from '../../util/data.generator';
import { _user } from '../../util/user.data-generator';

describe('AuthService', () => {
  let service: AuthService;
  let helper: DeepMocked<AuthServiceHelper>;

  beforeEach(async () => {
    const testModule = await Test.createTestingModule({ providers: [AuthService] })
      .useMocker(createMock)
      .compile();

    service = testModule.get(AuthService);
    helper = testModule.get(AuthServiceHelper);
  });

  describe('signUp', () => {
    it('returns helper.signUp when validatePasswordNotExposed is ok', async () => {
      const dto = _signUpDto();
      const user = _user({ email: dto.email });
      const response = new UserResponse(user);
      helper.validatePasswordNotExposed.mockResolvedValue(Ok(None));
      helper.signUp.mockResolvedValue(Ok(response));
      const actual = await service.signUp(dto, createMock<Response>());
      expect(actual.isOk()).toBeTrue();
      expect(actual.unwrap()).toEqual(response);
    });

    it('returns err when validatePasswordNotExposed returns error', async () => {
      const dto = _signUpDto();
      helper.validatePasswordNotExposed.mockResolvedValue(Err(defaultServiceError));
      const actual = await service.signUp(dto, createMock<Response>());
      expect(actual.isErr()).toBeTrue();
      expect(actual.unwrapErr()).toEqual(defaultServiceError);
      expect(helper.signUp).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('returns helper.validateUser when findUserByEmail returns a user', async () => {
      const email = _email();
      const user = _user({ email });
      helper.findUserByEmail.mockResolvedValue(Ok(user));
      helper.validateUser.mockResolvedValue(Ok({ id: user.id, email, password: _password() }));
      const actual = await service.validateUser(email, _password());
      expect(actual.isOk()).toBeTrue();
      expect(actual.unwrap().id).toEqual(user.id);
      expect(helper.validateUser).toHaveBeenCalled();
    });

    it('returns err when findUserByEmail returns an error', async () => {
      const email = _email();
      helper.findUserByEmail.mockResolvedValue(Err(defaultServiceError));
      const actual = await service.validateUser(email, _password());
      expect(actual.isErr()).toBeTrue();
      expect(actual.unwrapErr()).toEqual(defaultServiceError);
      expect(helper.validateUser).not.toHaveBeenCalled();
    });
  });
});
