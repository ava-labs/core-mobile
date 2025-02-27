export const isPositiveNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value) && value > 0
}
