import { AuthRole, Public, Secure } from '@/auth/model';
import { CreateMovieDto, FindMoviesDto, MovieResponse, UpdateMovieDto } from '@/movie/model';
import { MovieService } from '@/movie/movie.service';
import { PageDto, PageResponse } from '@/shared/controller/model';
import { ParseIdPipe } from '@/shared/controller/validation';
import { ServiceErrorCode, throwHttpException } from '@/shared/error';
import { ApiRoute } from '@/shared/swagger';
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('movies')
@Controller('/movies')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Secure({ roles: [AuthRole.ADMIN] })
  @HttpCode(HttpStatus.CREATED)
  @Post('/')
  @ApiRoute('Create a new movie', {
    secure: true,
    admin: true,
    success: {
      status: HttpStatus.CREATED,
      type: MovieResponse,
      description: 'The newly created movie'
    },
    errors: [ServiceErrorCode.MOVIE_ALREADY_EXISTS]
  })
  public async createMovie(
    @Body() dto: CreateMovieDto
  ): Promise<MovieResponse> {
    return (await this.movieService.createMovie(dto)).match({
      ok: _ => _,
      err: e => throwHttpException(e)
    });
  }

  @Secure({ roles: [AuthRole.ADMIN] })
  @Patch('/:id')
  @ApiRoute('Update a movie by id', {
    secure: true,
    admin: true,
    success: {
      status: HttpStatus.OK,
      type: MovieResponse,
      description: 'The updated movie'
    },
    errors: [ServiceErrorCode.MOVIE_NOT_FOUND]
  })
  public async updateMovie(
    @Param('id', ParseIdPipe) id: string,
    @Body() dto: UpdateMovieDto
  ): Promise<MovieResponse> {
    return (await this.movieService.updateMovie(id, dto)).match({
      ok: _ => _,
      err: e => throwHttpException(e)
    });
  }

  @Public()
  @Get('/:id')
  @ApiRoute('Get the movie with the supplied id', {
    success: {
      status: HttpStatus.OK,
      type: MovieResponse,
      description: 'The movie with the supplied id'
    },
    errors: [ServiceErrorCode.MOVIE_NOT_FOUND]
  })
  public async getMovie(
    @Param('id', ParseIdPipe) id: string
  ): Promise<MovieResponse> {
    return (await this.movieService.getMovie(id)).match({
      ok: _ => _,
      err: e => throwHttpException(e)
    });
  }

  @Public()
  @Get('/')
  @ApiRoute('Find all movies matching the supplied parameters', {
    pageable: true,
    success: {
      status: HttpStatus.OK,
      type: MovieResponse,
      description: 'The movies matching the supplied parameters'
    }
  })
  public async findMovies(
    @Query() dto: FindMoviesDto,
    @Query() page: PageDto
  ): Promise<PageResponse<MovieResponse>> {
    return (await this.movieService.findAllMovies(dto, page)).match({
      ok: _ => _,
      err: e => throwHttpException(e)
    });
  }
}
