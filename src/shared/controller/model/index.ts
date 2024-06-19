import _ from 'lodash';
import { UpdateQuery } from 'mongoose';

export { PageDto } from './page.dto';
export { PageResponse } from './page.response';

export function toUpdateQuery(dto: any): UpdateQuery<any> {
  const $set = { ...(_.omitBy(dto, _.isNil)) };
  const $unset = { ...(_.pickBy(dto, _.isNull)) };
  return { $set, $unset };
}
