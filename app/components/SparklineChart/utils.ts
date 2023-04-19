export const NEGATIVE_GRADIENT_FILL_COLORS = ['#411712', '#260E0A', '#000000']

export const POSITIVE_GRADIENT_FILL_COLORS = ['#213822', '#121F13', '#000000']

export const POSITIVE_SHADOW_COLOR = '#429B58'

export const yToX = (
  data: {
    date: Date
    value: number
  }[],
  y: number,
  width: number
) => {
  const index = data.findIndex(val => val.value === y)
  return (index / data.length) * width
}
