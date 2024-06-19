import { Expose, ExposeOptions, Transform } from 'class-transformer';
import { TransformFnParams, TransformOptions } from 'class-transformer/types/interfaces';
import _ from 'lodash';

export function toLowerCase(param: TransformFnParams): string | string[] | undefined {
  if (_.isNil(param?.value)) {
    return undefined;
  }
  if (Array.isArray(param.value)) {
    return (param.value as string[]).map(it => it.toLowerCase());
  }
  return (param.value as string).toLowerCase();
}

export function toNumber(param: TransformFnParams): number | undefined {
  return _.isNil(param?.value) ? undefined : Number(param.value);
}

export function toBoolean(param: TransformFnParams): boolean | undefined {
  return _.isNil(param?.value) ? undefined : (param.value === true || param.value === 'true');
}

export function split(param: TransformFnParams, delimiter?: string): string[] | undefined {
  return _.isNil(param?.value) ? undefined : (param.value as string).split(delimiter || /[:,]/);
}

export function DefaultValue(val: any, options?: DefaultValueOptions): PropertyDecorator {
  const transformFn = Transform(({ value }) => {
    if (value === undefined) return val;
    return value;
  }, options?.transformOptions);
  const exposeFn = Expose(options?.exposeOptions);
  return function(target: any, key: string) {
    transformFn(target, key);
    exposeFn(target, key);
  };
}

export type DefaultValueOptions = {
  transformOptions?: TransformOptions;
  exposeOptions?: ExposeOptions;
};
