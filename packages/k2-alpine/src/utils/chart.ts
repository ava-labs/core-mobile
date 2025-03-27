import { curveBasis, interpolateBasis, line, scaleLinear } from 'd3'

export const makeCurve = ({
  data,
  size,
  xPadding = 0,
  yPadding = 0
}: {
  data: DataPoint[]
  size: { width: number; height: number }
  xPadding?: number
  yPadding?: number
}): { path: string | null; lastPoint: { x: number; y: number } | null } => {
  const max = Math.max(...data.map(val => val.value))
  const min = Math.min(...data.map(val => val.value))

  const x = scaleLinear()
    .domain([0, data.length - 1])
    .range([xPadding, size.width - xPadding])

  const y = scaleLinear()
    .domain([min, max])
    .range([size.height - yPadding, yPadding])

  const last = data[data.length - 1]
  const lastPoint = last
    ? {
        x: x(last.index),
        y: y(last.value)
      }
    : null

  return {
    path: line<DataPoint>()
      .x(d => x(d.index))
      .y(d => y(d.value))
      .curve(curveBasis)(data),
    lastPoint
  }
}

export const getYFromX = ({
  x,
  data,
  size,
  xPadding = 0,
  yPadding = 0
}: {
  x: number
  data: DataPoint[]
  size: { width: number; height: number }
  xPadding?: number
  yPadding?: number
}): number => {
  // Calculate the minimum and maximum values from the data
  const min = Math.min(...data.map(d => d.value))
  const max = Math.max(...data.map(d => d.value))

  // Create the y-scale (in SVG, y=0 is at the top, so reverse the range)
  const yScale = scaleLinear()
    .domain([min, max])
    .range([size.height - yPadding, 0])

  // Calculate the effective width (removing left and right paddings)
  const effectiveWidth = size.width - 2 * xPadding

  // Clamp the x-coordinate within the valid range
  const clampedX = Math.max(xPadding, Math.min(x, size.width - xPadding))

  // Calculate the proportion (t) within the effective width (0 ~ 1)
  const t = (clampedX - xPadding) / effectiveWidth

  // Extract the values from the data array
  const values = data.map(d => d.value)

  // d3.interpolateBasis requires at least 3 values.
  if (values.length < 3) {
    // If there are not enough values, use linear interpolation as a fallback.
    const linearInterpolator = scaleLinear()
      .domain([xPadding, size.width - xPadding])
      .range([values[0] ?? 0, values[values.length - 1] ?? 0])
    return yScale(linearInterpolator(clampedX))
  }

  // Create a basis interpolator using the values.
  const interpolator = interpolateBasis(values)
  const interpolatedValue = interpolator(t)

  // Return the y-coordinate corresponding to the interpolated value.
  return yScale(interpolatedValue)
}

export type DataPoint = {
  value: number
  index: number
}
