import { BaseRepository } from '@/db/base.repository';
import { Movie } from '@/movie/model';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { Injectable } from '@nestjs/common';
import { ModelType } from '@typegoose/typegoose/lib/types';

@Injectable()
export class MovieRepository extends BaseRepository<Movie> {
  constructor(@InjectModel(Movie) protected readonly model: ModelType<Movie>) {
    super(model);
  }
}
