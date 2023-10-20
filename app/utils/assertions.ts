type NonUndefined<T> = T extends undefined ? never : T
type NonNull<T> = T extends null ? never : T

export function assertNotUndefined<T>(
  input: T
): asserts input is NonUndefined<T> {
  if (input === undefined) throw new Error('input is undefined')
}

export function assertNotNull<T>(
  input: T,
  msg?: string
): asserts input is NonNull<T> {
  if (input === undefined) throw new Error(msg || 'input is null')
}
