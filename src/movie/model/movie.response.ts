import { Movie } from '@/movie/model/movie.entity';
import { ApiResponseProperty } from '@nestjs/swagger';
import { Swagger } from '@/shared/swagger/swagger.examples';

export class MovieResponse {
  @ApiResponseProperty({ example: Swagger.movie.id })
  id: string;

  @ApiResponseProperty({ example: Swagger.movie.title })
  title: string;

  @ApiResponseProperty({ example: Swagger.movie.genres })
  genres: string[];

  @ApiResponseProperty({ example: Swagger.movie.releaseYear })
  releaseYear: number;

  @ApiResponseProperty({ example: Swagger.movie.runtimeMins })
  runtimeMins: number;

  constructor(movie: Movie) {
    this.id = movie.id;
    this.title = movie.title;
    this.genres = movie.genres;
    this.releaseYear = movie.releaseYear;
    this.runtimeMins = movie.runtimeMins;
  }
}
