import { BaseEntity } from '@/db/model';
import _ from 'lodash';
import { FilterQuery } from 'mongoose';

// mongo duplicate key error code:
export const duplicateKeyErrorCode = 11000;

type Key<T> = keyof T;
type Value<T> = T[keyof T] | T[keyof T][];
type FindOp = '$eq' | '$ne' | '$gt' | '$gte' | '$lt' | '$lte';
type ArrayFindOp = '$in' | '$nin';

export function toFilterQuery<Dto extends object, Entity extends BaseEntity>(dto: Dto): FilterQuery<Entity> {
  const sanitizedDto: Partial<Required<Dto>> = _.pickBy(dto);
  if (_.isEmpty(sanitizedDto)) {
    return {};
  }
  if (_.size(sanitizedDto) == 1) {
    return getCriteria<Entity>(_.keys(sanitizedDto)[0] as Key<Entity>, _.values(sanitizedDto)[0] as Value<Entity>);
  }
  return {
    $and: _.toPairs(sanitizedDto).map(([key, val]) => {
      return getCriteria<Entity>(key as Key<Entity>, val as Value<Entity>);
    })
  } as FilterQuery<Entity>;
}

const getCriteria = <Entity>(
  key: Key<Entity>,
  val: Value<Entity>
): FilterQuery<Entity> => ({ [key]: { [getOp(val)]: val } } as FilterQuery<Entity>);

const getOp = (val: any | any[]): FindOp | ArrayFindOp => _.isArray(val) ? '$in' : '$eq';
