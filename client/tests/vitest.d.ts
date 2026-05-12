import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

// vitest 3 sources its Assertion interface from @vitest/expect, but
// @testing-library/jest-dom augments `vitest`. We bridge it explicitly so
// matchers like toBeInTheDocument / toBeDisabled are typed at test sites.
declare module '@vitest/expect' {
  interface Assertion<T = unknown> extends TestingLibraryMatchers<unknown, T> {}
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<unknown, unknown> {}
}
