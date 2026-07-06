import React from 'react'
import { StyleSheet } from 'react-native'
import { LineGraph } from 'react-native-graph'
import type { GraphPoint } from 'react-native-graph'
import { View } from '@avalabs/k2-alpine'

// Colors from the design tokens (Alternates palette)
export const OUTCOME_COLORS = [
  '#00C2B4', // Teal 2
  '#DE78A2', // Pink 2
  '#F95D6A', // Red 1
  '#9A89BD', // Purple dark 3
  '#FFB800' // fallback
]

export interface OutcomeSeries {
  label: string
  points: GraphPoint[]
}

interface ProbabilityChartProps {
  series: OutcomeSeries[]
  height?: number
}

export function ProbabilityChart({
  series,
  height = 140
}: ProbabilityChartProps): JSX.Element {
  return (
    <View style={{ height }}>
      {series.map((s, i) => (
        <LineGraph
          key={s.label}
          style={[styles.graph, i === 0 ? styles.relative : styles.absolute]}
          animated={false}
          color={OUTCOME_COLORS[i % OUTCOME_COLORS.length] ?? '#00C2B4'}
          lineThickness={2}
          points={s.points}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  graph: {
    width: '100%',
    height: '100%'
  },
  relative: {
    position: 'relative'
  },
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  }
})
