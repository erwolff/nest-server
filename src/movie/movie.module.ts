import { DbModule } from '@/db/db.module';
import { LoggerModule } from '@/logger/logger.module';
import { Movie } from '@/movie/model';
import { MovieController } from '@/movie/movie.controller';
import { MovieRepository } from '@/movie/movie.repository';
import { MovieService } from '@/movie/movie.service';
import { TypegooseModule } from '@m8a/nestjs-typegoose';
import { Module, ModuleMetadata } from '@nestjs/common';

export const movieModuleMetadata: ModuleMetadata = {
  imports: [DbModule, LoggerModule, TypegooseModule.forFeature([Movie])],
  controllers: [MovieController],
  providers: [MovieRepository, MovieService]
};

@Module(movieModuleMetadata)
export class MovieModule {}
