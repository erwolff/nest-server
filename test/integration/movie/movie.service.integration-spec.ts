import { FindMoviesDto, UpdateMovieDto } from '@/movie/model';
import { MovieService } from '@/movie/movie.service';
import { ServiceErrorCode } from '@/shared/error';
import { _idString, _pageDto, defaultServiceError } from '../../util/data.generator';
import { _createMovieDto, _title, _updateMovieDto } from '../../util/movie.data-generator';
import { integrationAppModule } from '../jest-integration.wrapper';

describe('MovieService', () => {
  let service: MovieService;

  beforeAll(async () => {
    service = integrationAppModule.get(MovieService);
  });

  describe('createMovie', () => {
    it('returns movie when successfully saved', async () => {
      const dto = _createMovieDto();
      const result = await service.createMovie(dto);
      expect(result.isOk()).toBeTrue();
      expect(result.unwrap().id).not.toBeUndefined();
    });
  });

  describe('updateMovie', () => {
    it('returns movie when successfully updated', async () => {
      const movie = (await service.createMovie(_createMovieDto())).unwrap();
      const dto = new UpdateMovieDto();
      dto.title = _title();
      const result = await service.updateMovie(movie.id, dto);
      expect(result.isOk()).toBeTrue();
      expect(result.unwrap().title).toEqual(dto.title);
    });

    it('returns MOVIE_NOT_FOUND when not found', async () => {
      const result = await service.updateMovie(_idString(), _updateMovieDto());
      expect(result.isErr()).toBeTrue();
      expect(result.unwrapErr().errorCode).toEqual(ServiceErrorCode.MOVIE_NOT_FOUND);
    });
  });

  describe('getMovie', () => {
    it('returns movie when found', async () => {
      const movie = (await service.createMovie(_createMovieDto())).unwrap();
      const result = await service.getMovie(movie.id);
      expect(result.isOk()).toBeTrue();
      expect(result.unwrap()).toEqual(movie);
    });

    it('returns MOVIE_NOT_FOUND when not found', async () => {
      const result = await service.getMovie(_idString());
      expect(result.isErr()).toBeTrue();
      expect(result.unwrapErr().errorCode).toEqual(ServiceErrorCode.MOVIE_NOT_FOUND);
    });

    it('returns err when repo returns err', async () => {
      // pass an invalid id in order to cause the repo to err
      const result = await service.getMovie('✅ expected');
      expect(result.isErr()).toBeTrue();
      expect(result.unwrapErr()).toEqual(defaultServiceError);
    });
  });

  describe('findMovies', () => {
    it('returns a page of movies when found', async () => {
      const familyComedy = (await service.createMovie(_createMovieDto({ genres: ['Family', 'Comedy'] }))).unwrap();
      const actionComedy = (await service.createMovie(_createMovieDto({ genres: ['Action', 'Comedy'] }))).unwrap();
      const comedy = (await service.createMovie(_createMovieDto({ genres: ['Comedy'] }))).unwrap();
      const action = (await service.createMovie(_createMovieDto({ genres: ['Action'] }))).unwrap();
      const dto = new FindMoviesDto();
      dto.genres = ['Comedy'];
      const result = await service.findMovies(dto, _pageDto());
      expect(result.isOk()).toBeTrue();
      const page = result.unwrap();
      expect(page.total).toEqual(3);
      expect(page.content).toContainAllValues([familyComedy, actionComedy, comedy]);
    });
  });

  describe('deleteMovie', () => {
    it('returns None when repo returns ok', async () => {
      const result = await service.deleteMovie(_idString());
      expect(result.isOk()).toBeTrue();
      expect(result.unwrap().isNone()).toBeTrue();
    });

    it('returns err when repo returns err', async () => {
      // pass an invalid id in order to cause the repo to err
      const result = await service.deleteMovie('✅ expected');
      expect(result.isErr()).toBeTrue();
      expect(result.unwrapErr()).toEqual(defaultServiceError);
    });
  });
});
