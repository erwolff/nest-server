import { AuthRole } from '@/auth/model';
import { MovieResponse, toMovie, UpdateMovieDto } from '@/movie/model';
import { MovieRepository } from '@/movie/movie.repository';
import { ServiceErrorCode } from '@/shared/error';
import { HttpStatus } from '@nestjs/common';
import { _title } from 'casual';
import request from 'supertest';
import { _idString } from '../../util/data.generator';
import { _createMovieDto, _updateMovieDto } from '../../util/movie.data-generator';
import { e2eAppModule, TestRequest } from '../jest-e2e.wrapper';

describe('/movies', () => {
  let repo: MovieRepository;

  beforeAll(async () => {
    repo = e2eAppModule.get(MovieRepository);
  });

  describe('POST /', () => {
    it('valid body returns 201', async () => {
      const dto = _createMovieDto();
      await new TestRequest(AuthRole.ADMIN)
        .post('/movies')
        .send({ ...dto })
        .expect(HttpStatus.CREATED)
        .expect((res: request.Response) => {
          const { id }: MovieResponse = res.body;
          expect(id).not.toBeUndefined();
        });
    });
  });

  describe('GET /:id', () => {
    it('valid id returns 200', async () => {
      const movie = (await repo.save(toMovie(_createMovieDto()))).unwrap();
      await new TestRequest(AuthRole.USER)
        .get(`/movies/${movie.id}`)
        .expect(HttpStatus.OK)
        .expect(JSON.stringify(new MovieResponse(movie)));
    });

    it('non-existent id returns 404', async () => {
      await new TestRequest(AuthRole.USER)
        .get(`/movies/${_idString()}`)
        .expect(HttpStatus.NOT_FOUND)
        .expect({
          statusCode: 404,
          message: 'No movie exists with that id',
          errorCode: ServiceErrorCode.MOVIE_NOT_FOUND
        });
    });

    it('invalid id returns 400', async () => {
      await new TestRequest(AuthRole.USER)
        .get(`/movies/123`)
        .expect(HttpStatus.BAD_REQUEST)
        .expect({
          statusCode: 400,
          message: 'Request failed validation - see details',
          errorCode: 'validation_failed',
          details: {
            id: 'must be a bson object id'
          }
        });
    });
  });

  describe('PATCH /:id', () => {
    it('valid request returns 200', async () => {
      const movie = (await repo.save(toMovie(_createMovieDto()))).unwrap();
      const dto = new UpdateMovieDto();
      dto.title = _title();
      movie.title = dto.title;
      await new TestRequest(AuthRole.ADMIN)
        .patch(`/movies/${movie.id}`)
        .send({ ...dto })
        .expect(HttpStatus.OK)
        .expect(JSON.stringify(new MovieResponse(movie)));
    });

    it('non-existent id returns 404', async () => {
      await new TestRequest(AuthRole.ADMIN)
        .patch(`/movies/${_idString()}`)
        .send({ ..._updateMovieDto() })
        .expect(HttpStatus.NOT_FOUND)
        .expect({
          statusCode: 404,
          message: 'No movie exists with that id',
          errorCode: ServiceErrorCode.MOVIE_NOT_FOUND
        });
    });
  });

  describe('DELETE /:id', () => {
    it('valid request returns 200', async () => {
      const movie = (await repo.save(toMovie(_createMovieDto()))).unwrap();
      await new TestRequest(AuthRole.ADMIN)
        .delete(`/movies/${movie.id}`)
        .expect(HttpStatus.OK);
    });

    it('non-existent id returns 200', async () => {
      await new TestRequest(AuthRole.ADMIN)
        .delete(`/movies/${_idString()}`)
        .expect(HttpStatus.OK);
    });
  });
});
