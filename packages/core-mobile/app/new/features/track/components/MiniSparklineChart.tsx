import React, { FC } from 'react'
import { LineGraph } from 'react-native-graph'

// const NEGATIVE_GRADIENT_FILL_COLORS = ['#EA4542', '#F5643B']
// const POSITIVE_GRADIENT_FILL_COLORS = ['#1FC626', '#42C49F']

const MiniSparklineChart: FC<Props> = ({
  width,
  height,
  data,
  lineThickness = 3,
  negative = false
}) => {
  return (
    <LineGraph
      style={{ width, height }}
      testID="line_graph"
      animated={false}
      color={negative ? '#EA4542' : '#1FC626'}
      lineThickness={lineThickness}
      points={data}
    />
  )
}

interface Props {
  width: number
  height: number
  data: { date: Date; value: number }[]
  lineThickness?: number
  negative?: boolean
}

export default MiniSparklineChart
