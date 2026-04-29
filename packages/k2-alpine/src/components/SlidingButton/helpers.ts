export const computeMaxTravel = ({
  trackWidth,
  thumbSize,
  padding
}: {
  trackWidth: number
  thumbSize: number
  padding: number
}): number => {
  return Math.max(0, trackWidth - thumbSize - padding * 2)
}

export const normalizeThreshold = (threshold: number | undefined): number => {
  if (threshold === undefined) return 0.9
  return Math.min(Math.max(threshold, 0), 1)
}

export const crossedThreshold = ({
  translateX,
  maxTravel,
  threshold
}: {
  translateX: number
  maxTravel: number
  threshold: number
}): boolean => {
  'worklet'
  if (maxTravel <= 0) return false
  return Math.abs(translateX) / maxTravel >= threshold
}

type Side = 'left' | 'right'

export const activeSide = (translateX: number): Side | null => {
  'worklet'
  if (translateX > 0) return 'right'
  if (translateX < 0) return 'left'
  return null
}
