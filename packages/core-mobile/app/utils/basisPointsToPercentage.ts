// E.g. 85 -> 0.85%
export const basisPointsToPercentage = (basisPoints: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(basisPoints / 10_000)
}
