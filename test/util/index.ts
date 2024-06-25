import { Page } from '@/db/model';
import { PageDto } from '@/shared/controller/model';

export const pageFrom = <T>(dto: PageDto, content: T[]): Page<T> =>
  new Page(dto.page, dto.limit, 'createdAt', dto.order, content.length, content);
