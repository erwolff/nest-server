import { configureApp } from '@/app.config';
import { AppModule } from '@/app.module';
import { AuthRole } from '@/auth/model';
import { AwsSqsProvider } from '@/aws/aws-sqs.provider';
import { DbModule } from '@/db/db.module';
import { ConsumerRegistrar } from '@/pubsub/consumer.registrar';
import { User } from '@/user/model';
import { UserRepository } from '@/user/user.repository';
import { SQSClient } from '@aws-sdk/client-sqs';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { getConnectionToken } from '@m8a/nestjs-typegoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import bcrypt from 'bcrypt';
import { RedisCache } from 'cache-manager-ioredis-yet';
import { Connection } from 'mongoose';
import request from 'supertest';
import { TestDbModule } from '../db/test-db.module';
import { _password } from '../util/data.generator';
import { _user } from '../util/user.data-generator';

export let e2eAppModule: TestingModule;
export let app: INestApplication;
export let unauthenticatedUser: User;
export let authenticatedUser: User;
export let authenticatedAdmin: User;
let userRepo: UserRepository;
let pw: string;
let encryptedPw: string;
let authenticatedAdminCookies: string;
let authenticatedUserCookies: string;

beforeAll(async () => {
  // wire up our dependencies but swap out the DbModule with our TestDbModule
  e2eAppModule = await Test
    .createTestingModule({ imports: [AppModule] })
    .overrideModule(DbModule).useModule(TestDbModule)
    .overrideProvider(AwsSqsProvider).useValue(createMock<AwsSqsProvider>())
    .compile();
  app = e2eAppModule.createNestApplication();
  configureApp(app);
  await app.init();
  userRepo = app.get(UserRepository);
  pw = _password();
  encryptedPw = bcrypt.hashSync(pw, 10);
});

beforeEach(async () => {
  mockAws();
  await generateAndStoreUsers();
  await loginUsersAndStoreCookies();
});

afterEach(async () => {
  const connection: Connection = e2eAppModule.get(getConnectionToken());
  await Promise.all(
    (await (connection.getClient().db().collections())).map(async collection => {
      await collection.deleteMany({});
    })
  );
});

afterAll(async () => {
  // disconnect all sqs consumers
  const consumerRegistrar = e2eAppModule.get(ConsumerRegistrar);
  await (consumerRegistrar as any).disconnectAll();
  // clean up the db and its connections
  const connection: Connection = e2eAppModule.get(getConnectionToken());
  await connection.getClient().db().dropDatabase();
  await connection.getClient().close();
  // clean up the cache connections
  const cache = e2eAppModule.get<RedisCache>(CACHE_MANAGER);
  await cache.store.client.quit();
  // close the app
  await app.close();
});

function mockAws(): void {
  const sqs: DeepMocked<AwsSqsProvider> = e2eAppModule.get(AwsSqsProvider);
  const sqsClient = createMock<SQSClient>();
  sqsClient.send.mockResolvedValue(createMock());
  sqs.getClient.mockReturnValue(sqsClient);
}

async function generateAndStoreUsers(): Promise<void> {
  authenticatedUser = _user({ password: encryptedPw });
  authenticatedAdmin = _user({ roles: [AuthRole.ADMIN], password: encryptedPw });
  unauthenticatedUser = _user({});
  await userRepo.save(authenticatedUser);
  await userRepo.save(authenticatedAdmin);
  await userRepo.save(unauthenticatedUser);
}

async function loginUsersAndStoreCookies(): Promise<void> {
  const userLogin = await request(app.getHttpServer()).post('/auth/login').send({
    email: authenticatedUser.email,
    password: pw
  });
  authenticatedUserCookies = userLogin.headers['set-cookie'];
  const adminLogin = await request(app.getHttpServer()).post('/auth/login').send({
    email: authenticatedAdmin.email,
    password: pw
  });
  authenticatedAdminCookies = adminLogin.headers['set-cookie'];
}

export class TestRequest {
  private readonly request: request.SuperTest<request.Test>;
  private readonly cookies?: string;
  constructor(role?: AuthRole) {
    this.request = request(app.getHttpServer());
    switch (role) {
      case AuthRole.ADMIN:
        this.cookies = authenticatedAdminCookies;
        break;
      case AuthRole.USER:
        this.cookies = authenticatedUserCookies;
        break;
    }
  }

  public get(path: string) {
    return this.cookies
      ? this.request.get(path).set('Cookie', this.cookies)
      : this.request.get(path);
  }

  public post(path: string) {
    return this.cookies
      ? this.request.post(path).set('Cookie', this.cookies)
      : this.request.post(path);
  }

  public patch(path: string) {
    return this.cookies
      ? this.request.patch(path).set('Cookie', this.cookies)
      : this.request.patch(path);
  }

  public delete(path: string) {
    return this.cookies
      ? this.request.delete(path).set('Cookie', this.cookies)
      : this.request.delete(path);
  }
}
