import { ApiProperty } from '@nestjs/swagger';
import { Swagger } from '@/shared/swagger/swagger.examples';
import { IsArray, IsOptional } from 'class-validator';
import { split } from '@/shared/controller/validation';
import { Transform } from 'class-transformer';

export class FindMoviesDto {
  @ApiProperty({ example: [Swagger.movie.title ] })
  @IsArray()
  @Transform(split)
  @IsOptional()
  title?: string[];

  @ApiProperty({ example: Swagger.movie.genres })
  @IsArray()
  @Transform(split)
  @IsOptional()
  genre?: string[];
}
