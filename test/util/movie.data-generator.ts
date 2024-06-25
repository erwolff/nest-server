import { CreateMovieDto, FindMoviesDto, Movie, UpdateMovieDto } from '@/movie/model';
import casual from 'casual';
import { _id, randomInt } from './data.generator';

export const _title = (): string => casual.title;
export const _genres = (num = 2): string[] => {
  let genres: string[] = [];
  for (let i = 0; i < num; i++) {
    genres.push(casual.word);
  }
  return genres;
};

export const _movie = (set?: Partial<Movie> | CreateMovieDto): Movie =>
  Object.assign(new Movie(), {
    _id: _id(),
    title: _title(),
    genres: _genres(),
    releaseYear: randomInt(1950, 2024),
    runtimeMins: randomInt(45, 200),
    ...set
  });

export const _createMovieDto = (set?: Partial<CreateMovieDto>): CreateMovieDto =>
  Object.assign(new CreateMovieDto(), {
    ..._movie(),
    ...set
  });

export const _updateMovieDto = (set?: Partial<UpdateMovieDto>): UpdateMovieDto =>
  Object.assign(new UpdateMovieDto(), {
    ..._movie(),
    ...set
  });

export const _findMoviesDto = (set?: Partial<FindMoviesDto>): FindMoviesDto =>
  Object.assign(new FindMoviesDto(), {
    title: [_title()],
    genres: _genres()
  });
