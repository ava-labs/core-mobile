/**
 * Memoizes a pure function on reference equality of its arguments, keeping a
 * single cached result (the same strategy reselect uses for `createSelector`
 * inputs).
 *
 * Used to give derived selectors a stable output identity. A selector that
 * allocates a fresh object on every call silently defeats every downstream
 * `createSelector` memo and every `useSelector` reference comparison, which
 * re-renders all of its consumers on every dispatched action (CP-14918).
 *
 * Hand-rolled rather than imported from reselect because `reselect` is only a
 * transitive dependency here (via `@reduxjs/toolkit`) and is not declared in
 * this package's `package.json`, so relying on its named exports at runtime is
 * not safe under the monorepo's Metro resolution.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const memoizeByReference = <TArgs extends any[], TResult>(
  fn: (...args: TArgs) => TResult
): ((...args: TArgs) => TResult) => {
  let lastArgs: TArgs | undefined
  let lastResult: TResult

  return (...args: TArgs): TResult => {
    if (
      lastArgs === undefined ||
      lastArgs.length !== args.length ||
      args.some((arg, index) => arg !== lastArgs?.[index])
    ) {
      lastResult = fn(...args)
      lastArgs = args
    }
    return lastResult
  }
}
