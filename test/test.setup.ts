import * as matchers from 'jest-extended';

/**
 * Setup file called before each test suite runs
 */

// Set the NODE_ENV to 'test' for all test suites
process.env.NODE_ENV = 'test';

// adds all jest-extended matchers to jest
expect.extend(matchers);
