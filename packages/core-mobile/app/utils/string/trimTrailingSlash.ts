export function trimTrailingSlash<T extends string | undefined>(input: T): T {
  if (input?.endsWith('/')) {
    return input.slice(0, -1) as T
  }
  return input
}
