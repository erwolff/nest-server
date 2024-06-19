import { Page } from '@/db/model';
import { Swagger } from '@/shared/swagger/swagger.examples';
import { ApiResponseProperty } from '@nestjs/swagger';

export class PageResponse<T> {
  @ApiResponseProperty({ example: Swagger.page.num })
  page: number;

  @ApiResponseProperty({ example: Swagger.page.limit })
  limit: number;

  @ApiResponseProperty({ example: Swagger.page.sort })
  sort: string;

  @ApiResponseProperty({ example: Swagger.page.order })
  order: string;

  @ApiResponseProperty({ example: Swagger.page.total })
  total: number;

  @ApiResponseProperty()
  content: T[];

  constructor(page: Page<T>) {
    this.page = page.page;
    this.limit = page.limit;
    this.sort = page.sort;
    this.order = page.order;
    this.total = page.total;
    this.content = page.content;
  }
}
