import { MovieResponse } from '@/movie/model';
import { MovieRepository } from '@/movie/movie.repository';
import { MovieService } from '@/movie/movie.service';
import { ServiceError, ServiceErrorCode } from '@/shared/error';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { Err, Ok } from '@sniptt/monads';
import { defaultServiceError } from '../../util/data.generator';
import { _createMovieDto, _movie } from '../../util/movie.data-generator';

describe('MovieService', () => {
  let service: MovieService;
  let movieRepo: DeepMocked<MovieRepository>;

  beforeEach(async () => {
    const testModule = await Test.createTestingModule({ providers: [MovieService] })
      .useMocker(createMock)
      .compile();

    service = testModule.get(MovieService);
    movieRepo = testModule.get(MovieRepository);
  });

  describe('createMovie', () => {
    it('returns MovieResponse when save is successful', async () => {
      const dto = _createMovieDto();
      const movie = _movie(dto);
      movieRepo.save.mockResolvedValue(Ok(movie));
      const result = await service.createMovie(dto);
      expect(result.isOk()).toBeTrue();
      expect(result.unwrap()).toEqual(new MovieResponse(movie));
    });

    it('returns MOVIE_ALREADY_EXISTS when duplicateKeyError on save', async () => {
      const dto = _createMovieDto();
      movieRepo.save.mockResolvedValue(Err(new ServiceError(ServiceErrorCode.ENTITY_ALREADY_EXISTS)));
      const result = await service.createMovie(dto);
      expect(result.isErr()).toBeTrue();
      expect(result.unwrapErr().errorCode).toEqual(ServiceErrorCode.MOVIE_ALREADY_EXISTS);
    });

    it('returns INTERNAL_SERVER_ERROR when save fails', async () => {
      const dto = _createMovieDto();
      movieRepo.save.mockResolvedValue(Err(defaultServiceError));
      const result = await service.createMovie(dto);
      expect(result.isErr()).toBeTrue();
      expect(result.unwrapErr().errorCode).toEqual(ServiceErrorCode.INTERNAL_SERVER_ERROR);
    });
  });

  // etc etc
});
