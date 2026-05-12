export const clamp = (value: number, min: number, max: number): number => {
  'worklet'
  if (value < min) return min
  if (value > max) return max
  return value
}
