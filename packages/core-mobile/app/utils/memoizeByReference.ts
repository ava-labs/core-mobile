/**
 * Gives a derived selector a stable output identity so
 * `useSelector`/`createSelector` reference checks don't fire on every
 * dispatch -- CP-14918. Hand-rolled: `reselect` is only a transitive dep
 * here, not safe to import directly under this monorepo's Metro resolution.
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
