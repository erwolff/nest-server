import { toFilterQuery } from '@/db';
import { Page } from '@/db/model';
import { NestServerLogger } from '@/logger/nest-server.logger';
import { CreateMovieDto, FindMoviesDto, Movie, MovieResponse, toMovie, UpdateMovieDto } from '@/movie/model';
import { MovieRepository } from '@/movie/movie.repository';
import { PageDto, toUpdateQuery } from '@/shared/controller/model';
import { errMsg, internalServerError, ServiceError, serviceError, ServiceErrorCode, typedError } from '@/shared/error';
import { Injectable } from '@nestjs/common';
import { Ok, Result } from '@sniptt/monads';

@Injectable()
export class MovieService {
  constructor(
    private readonly logger: NestServerLogger,
    private readonly movieRepo: MovieRepository
  ) {
    this.logger.setContext(MovieService.name);
  }

  public async createMovie(dto: CreateMovieDto): Promise<Result<MovieResponse, ServiceError>> {
    const result = await this.movieRepo.save(toMovie(dto));
    return result.isOk()
      ? result.map(it => new MovieResponse(it))
      : this.transformErr(result);
  }

  public async updateMovie(movieId: string, dto: UpdateMovieDto): Promise<Result<MovieResponse, ServiceError>> {
    const update = toUpdateQuery(dto);
    const result = await this.movieRepo.updateById(movieId, toUpdateQuery(dto));
    if (result.isErr()) {
      this.logger.error(`Error when updating movie ${movieId} with ${JSON.stringify(update)}: ${errMsg(result)}`);
      return internalServerError();
    }
    return result.unwrap().match({
      some: movie => Ok(new MovieResponse(movie)),
      none: () => serviceError(ServiceErrorCode.MOVIE_NOT_FOUND)
    });
  }

  public async getMovie(movieId: string): Promise<Result<MovieResponse, ServiceError>> {
    const result = await this.movieRepo.findById(movieId);
    if (result.isErr()) {
      this.logger.error(`Error when finding movie by id ${movieId}: ${errMsg(result)}`);
      return internalServerError();
    }
    return result.unwrap().match({
      some: movie => Ok(new MovieResponse(movie)),
      none: () => serviceError(ServiceErrorCode.MOVIE_NOT_FOUND)
    });
  }

  public async findAllMovies(
    dto: FindMoviesDto,
    page: PageDto
  ): Promise<Result<Page<Movie>, ServiceError>> {
    const result = await this.movieRepo.findAll(page, toFilterQuery(dto));
    if (result.isErr()) {
      this.logger.error(`Error when finding all movies: ${errMsg(result)}`);
      return internalServerError();
    }
    return result;
  }

  private transformErr(result: Result<Movie, ServiceError>): Result<MovieResponse, ServiceError> {
    if (result.unwrapErr().errorCode === ServiceErrorCode.ENTITY_ALREADY_EXISTS) {
      return serviceError(ServiceErrorCode.MOVIE_ALREADY_EXISTS);
    }
    return typedError(result);
  }
}
