import { Swagger } from '@/shared/swagger/swagger.examples';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsNumber, Max, Min } from 'class-validator';
import { QueryOptions } from 'mongoose';
import { DefaultValue, toLowerCase, toNumber } from '@/shared/controller/validation';

export class PageDto {
  @ApiProperty({ example: Swagger.page.num })
  @Min(1)
  @IsNumber()
  @Transform(toNumber)
  @DefaultValue(1)
  page: number = 1;

  @ApiProperty({ example: Swagger.page.limit })
  @Min(1)
  @Max(100)
  @IsNumber()
  @Transform(toNumber)
  @DefaultValue(20)
  limit: number = 20;

  @ApiProperty({ example: Swagger.page.order })
  @IsIn(['asc', 'desc'])
  @Transform(toLowerCase)
  @DefaultValue('desc')
  order: string = 'desc';

  constructor(
    page: number,
    limit: number,
    order: string
  ) {
    this.page = page;
    this.limit = limit;
    this.order = order;
  }
}

export function toQueryOptions(dto: PageDto, sort: string): QueryOptions {
  return {
    sort: { [sort]: dto.order },
    skip: (dto.page - 1) * dto.limit,
    limit: dto.limit
  };
}
