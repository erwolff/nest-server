import { ApiProperty } from '@nestjs/swagger';
import { Swagger } from '@/shared/swagger/swagger.examples';
import { IsOptional } from 'class-validator';

export class UpdateMovieDto {
  @ApiProperty({ example: Swagger.movie.title })
  @IsOptional()
  title?: string;

  @ApiProperty({ example: Swagger.movie.genres })
  @IsOptional()
  genres: string[];

  @ApiProperty({ example: Swagger.movie.releaseYear })
  @IsOptional()
  releaseYear: number;

  @ApiProperty({ example: Swagger.movie.runtimeMins })
  @IsOptional()
  runtimeMins: number;
}
