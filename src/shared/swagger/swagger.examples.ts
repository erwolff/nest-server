import _ from 'lodash';
import ms from 'ms';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Swagger {
  export const page = {
    num: 1,
    limit: 20,
    sort: 'createdAt',
    order: 'desc',
    total: 1
  };

  export const base = {
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  export const auth = {
    email: 'myemail@example.com',
    password: 'my$_secure@_!passw0rd',
  };

  export const user = {
    id: '64b59b08dbcec85ec3feb93b',
    email: 'myemail@example.com',
    roles: ['user']
  };

  export const movie = {
    id: '6671e3a9316035a1e5a57509',
    title: 'Happy Feet',
    genres: ['Family', 'Comedy'],
    releaseYear: 2006,
    runtimeMins: 108
  }
}
