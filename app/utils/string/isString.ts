export const isString = (str: unknown): str is string => {
  return typeof str === 'string' || str instanceof String
}
