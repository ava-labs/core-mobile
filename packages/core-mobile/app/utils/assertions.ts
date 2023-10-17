type NonUndefined<T> = T extends undefined ? never : T

export function assertNotUndefined<T>(
  input: T
): asserts input is NonUndefined<T> {
  if (input === undefined) throw new Error('input is undefined')
}
