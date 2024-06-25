import { MovieResponse } from '@/movie/model';
import { MovieController } from '@/movie/movie.controller';
import { MovieService } from '@/movie/movie.service';
import { PageResponse } from '@/shared/controller/model';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { Err, Ok } from '@sniptt/monads';
import { pageFrom } from '../../util';
import { _idString, _pageDto, defaultHttpException, defaultServiceError } from '../../util/data.generator';
import { _createMovieDto, _findMoviesDto, _movie, _updateMovieDto } from '../../util/movie.data-generator';

describe('MovieController', () => {
  let controller: MovieController;
  let service: DeepMocked<MovieService>;

  beforeEach(async () => {
    const testModule = await Test.createTestingModule({ providers: [MovieController] })
      .useMocker(createMock)
      .compile();

    controller = testModule.get(MovieController);
    service = testModule.get(MovieService);
  });

  describe('createMovie', () => {
    it('returns MovieResponse on ok from service', async () => {
      const dto = _createMovieDto();
      const expected = new MovieResponse(_movie(dto));
      service.createMovie.mockResolvedValue(Ok(expected));
      await expect(controller.createMovie(dto)).resolves.toEqual(expected);
    });

    it('throws on err from service', async () => {
      const dto = _createMovieDto();
      service.createMovie.mockResolvedValue(Err(defaultServiceError));
      await expect(controller.createMovie(dto)).rejects.toMatchObject(defaultHttpException);
    });
  });

  describe('updateMovie', () => {
    it('returns MovieResponse on ok from service', async () => {
      const dto = _updateMovieDto();
      const expected = new MovieResponse(_movie(dto));
      service.updateMovie.mockResolvedValue(Ok(expected));
      await expect(controller.updateMovie(_idString(), dto)).resolves.toEqual(expected);
    });
  });

  it('throws on err from service', async () => {
    const dto = _updateMovieDto();
    service.updateMovie.mockResolvedValue(Err(defaultServiceError));
    await expect(controller.updateMovie(_idString(), dto)).rejects.toMatchObject(defaultHttpException);
  });

  describe('getMovie', () => {
    it('returns MovieResponse on ok from service', async () => {
      const movie = _movie();
      const expected = new MovieResponse(movie);
      service.getMovie.mockResolvedValue(Ok(expected));
      await expect(controller.getMovie(movie.id)).resolves.toEqual(expected);
    });

    it('throws on err from service', async () => {
      service.getMovie.mockResolvedValue(Err(defaultServiceError));
      await expect(controller.getMovie(_idString())).rejects.toMatchObject(defaultHttpException);
    });
  });

  describe('findMovies', () => {
    it('returns page of MovieResponses on ok from service', async () => {
      const dto = _findMoviesDto();
      const page = _pageDto();
      const movies = pageFrom(page, [_movie(), _movie()]);
      const expected = new PageResponse(movies.map(it => new MovieResponse(it)));
      service.findMovies.mockResolvedValue(Ok(expected));
      await expect(controller.findMovies(dto, page)).resolves.toEqual(expected);
    });
  });
});
