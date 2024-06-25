import { AppModule } from '@/app.module';
import { AwsSqsProvider } from '@/aws/aws-sqs.provider';
import { DbModule } from '@/db/db.module';
import { ConsumerRegistrar } from '@/pubsub/consumer.registrar';
import { SQSClient } from '@aws-sdk/client-sqs';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { getConnectionToken } from '@m8a/nestjs-typegoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisCache } from 'cache-manager-ioredis-yet';
import { Connection } from 'mongoose';
import { TestDbModule } from '../db/test-db.module';

export let integrationAppModule: TestingModule;
let app: INestApplication;

beforeAll(async () => {
  integrationAppModule = await Test.createTestingModule({ imports: [AppModule] })
    .overrideModule(DbModule).useModule(TestDbModule)
    .overrideProvider(AwsSqsProvider).useValue(createMock<AwsSqsProvider>())
    .compile();

  app = integrationAppModule.createNestApplication();
  await app.init();
});

beforeEach(async () => {
  mockAws();
});

afterEach(async () => {
  const connection: Connection = integrationAppModule.get(getConnectionToken());
  await Promise.all(
    (await (connection.getClient().db().collections())).map(async collection => {
      await collection.deleteMany({});
    })
  );
});

afterAll(async () => {
  // disconnect all sqs consumers
  const consumerRegistrar = integrationAppModule.get(ConsumerRegistrar);
  await (consumerRegistrar as any).disconnectAll();
  // clean up the db and its connections
  const connection: Connection = integrationAppModule.get(getConnectionToken());
  await connection.getClient().db().dropDatabase();
  await connection.getClient().close();
  // clean up the cache connections
  const cache = integrationAppModule.get<RedisCache>(CACHE_MANAGER);
  await cache.store.client.quit();
  // close the app
  await app.close();
});

function mockAws(): void {
  const sqs: DeepMocked<AwsSqsProvider> = integrationAppModule.get(AwsSqsProvider);
  const sqsClient = createMock<SQSClient>();
  sqsClient.send.mockResolvedValue(createMock());
  sqs.getClient.mockReturnValue(sqsClient);
}
