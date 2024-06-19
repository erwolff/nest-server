import { IsArray, IsNumber, IsString } from 'class-validator';
import { Movie } from '@/movie/model/movie.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Swagger } from '@/shared/swagger/swagger.examples';

export class CreateMovieDto {
  @ApiProperty({ example: Swagger.movie.title })
  @IsString()
  title: string;

  @ApiProperty({ example: Swagger.movie.genres })
  @IsString({ each: true })
  @IsArray()
  genres: string[];

  @ApiProperty({ example: Swagger.movie.releaseYear })
  @IsNumber()
  releaseYear: number;

  @ApiProperty({ example: Swagger.movie.runtimeMins })
  @IsNumber({ })
  runtimeMins: number;
}

export function toMovie(dto: CreateMovieDto): Movie {
  const movie = new Movie();
  movie.title = dto.title;
  movie.genres = dto.genres;
  movie.releaseYear = dto.releaseYear;
  movie.runtimeMins = dto.runtimeMins;
  return movie;
}
