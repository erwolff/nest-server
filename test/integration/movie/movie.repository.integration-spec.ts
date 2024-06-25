import { MovieRepository } from '@/movie/movie.repository';
import { integrationAppModule } from '../jest-integration.wrapper';
import { _movie, _title } from '../../util/movie.data-generator';
import { _id, _pageDto } from '../../util/data.generator';

describe('MovieRepository', () => {
  let repo: MovieRepository;

  beforeAll(async () => {
    repo = integrationAppModule.get(MovieRepository);
  });

  describe('findById', () => {
    it('returns Some(movie) when found', async () => {
      const movie = (await repo.save(_movie())).unwrap();
      const result = await repo.findById(movie.id);
      expect(result.isOk()).toBeTrue();
      const actual = result.unwrap();
      expect(actual.isSome()).toBeTrue();
      expect(actual.unwrap()).toEqual(movie);
    });

    it('returns None when not found', async () => {
      const actual = await repo.findById(_id().toHexString());
      expect(actual.isOk()).toBeTrue();
      expect(actual.unwrap().isNone()).toBeTrue();
    });
  });

  describe('findOne', () => {
    it('returns Some(movie) when found', async () => {
      const movie = (await repo.save(_movie())).unwrap();
      const actual = await repo.findOne({ _id: { $eq: movie._id } });
      expect(actual.isOk()).toBeTrue();
      expect(actual.unwrap().isSome()).toBeTrue();
    });

    it('returns None when not found', async () => {
      const actual = await repo.findOne({ _id: { $eq: _id() } });
      expect(actual.isOk()).toBeTrue();
      expect(actual.unwrap().isNone());
    });
  });

  describe('findAll', () => {
    it('returns a page of found movies', async () => {
      const movie1 = (await repo.save(_movie())).unwrap();
      // insert a random movie which we'll expect not to find
      await repo.save(_movie());
      const movie2 = (await repo.save(_movie())).unwrap();
      const result = await repo.findAll(_pageDto(), { _id: { $in: [movie1._id, movie2._id] } });
      expect(result.isOk()).toBeTrue();
      const actual = result.unwrap();
      expect(actual.total).toEqual(2);
      expect(actual.content).toContainAllValues([movie1, movie2]);
    });

    it('returns an empty page when no movies found', async () => {
      const actual = await repo.findOne({ _id: { $eq: _id() } });
      expect(actual.isOk()).toBeTrue();
      expect(actual.unwrap().isNone()).toBeTrue();
    });
  });

  describe('exists', () => {
    it('returns true when movie exists', async () => {
      const title = _title();
      (await repo.save(_movie({ title }))).unwrap();
      const result = await repo.exists({ title });
      expect(result.isOk()).toBeTrue();
      const actual = result.unwrap();
      expect(actual).toBeTrue();
    });

    it('returns false when movie does not exist', async () => {
      (await repo.save(_movie())).unwrap();
      const result = await repo.exists({ title: _title() });
      expect(result.isOk()).toBeTrue();
      const actual = result.unwrap();
      expect(actual).toBeFalse();
    });
  });

  describe('deleteOne', () => {
    it('returns true when deletes existing movie', async () => {
      const movie = (await repo.save(_movie())).unwrap();
      const actual = await repo.deleteOne({ _id: { $eq: movie._id } });
      expect(actual.isOk()).toBeTrue();
      expect(actual.unwrap()).toBeTrue();
      // check that the movie was deleted
      expect((await repo.findById(movie.id)).unwrap().isNone()).toBeTrue();
    });

    it('returns false when no movie deleted', async () => {
      const actual = await repo.deleteOne({ _id: { $eq: _id() } });
      expect(actual.isOk()).toBeTrue();
      expect(actual.unwrap()).toBe(false);
    });
  });

  describe('deleteById', () => {
    it('returns true when deletes existing movie', async () => {
      const movie = (await repo.save(_movie())).unwrap();
      const actual = await repo.deleteById(movie.id);
      expect(actual.isOk()).toBeTrue();
      expect(actual.unwrap()).toBeTrue();
      // check that the movie was deleted
      expect((await repo.findById(movie.id)).unwrap().isNone()).toBeTrue();
    });
  });
});
