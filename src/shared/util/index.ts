import { None, Option, Some } from '@sniptt/monads';
import { customAlphabet } from 'nanoid';

/**
 * Helper function to easily convert a nullable entity into an Option
 *
 * @param it
 */
export const toOption = <T>(it?: T | null): Option<T> => it && it !== 0 ? Some(it) : None;

export const nanoid = (): string => {
  return customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 21)();
};
