import * as process from 'node:process';

export default () => ({
  env: process.env.NODE_ENV || 'production',
  api: {
    port: Number(process.env.PORT || 3000)
  },
  auth: {
    domain: process.env.AUTH_DOMAIN,
    jwtSecret: process.env.AUTH_JWT_SECRET,
    jwtExpiresIn: process.env.AUTH_JWT_EXPIRES_IN || '7d',
    csrfTokenSecret: process.env.AUTH_CSRF_TOKEN_SECRET
  },
  aws: {
    env: process.env.AWS_ENV,
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sns: {
      uri: process.env.AWS_SNS_URI
    },
    sqs: {
      uri: process.env.AWS_SQS_URI,
      defaults: {
        consumerCount: Number(process.env.AWS_SQS_DEFAULT_CONSUMER_COUNT || 1),
        maxReceiveCount: Number(process.env.AWS_SQS_DEFAULT_MAX_RECEIVE_COUNT || 5)
      }
    }
  },
  cors: {
    allowList: process.env.CORS_ALLOW_LIST?.split(',')
  },
  cache: {
    uri: process.env.CACHE_URI
  },
  db: {
    uri: process.env.DB_URI
  }
});

export const Environment = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test'
} as const;
