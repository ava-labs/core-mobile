export const lowerCaseKeys = <T>(obj: Record<string, T>): Record<string, T> => {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key.toLowerCase(), value])
  )
}
