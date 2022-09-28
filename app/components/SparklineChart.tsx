import React, { FC } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import {
  GradientProps,
  SlideAreaChart
} from '@connectedcars/react-native-slide-charts'
import { LinearGradient, Stop } from 'react-native-svg'

interface Props {
  width?: number
  height?: number
  animated?: boolean
  data: { x: number; y: number }[]
  yRange: [number, number]
  xRange: [number, number]
  negative?: boolean
  interactive?: boolean
}

const SparklineChart: FC<Props> = ({
  width = 100,
  height = 80,
  animated = false,
  data,
  yRange,
  xRange,
  negative = false,
  interactive = false
}) => {
  const theme = useApplicationContext().theme
  const { currencyFormatter } = useApplicationContext().appHook

  const defaultAreaChartFillGradient = (
    props: GradientProps,
    isNegative: boolean
  ) => {
    return (
      <LinearGradient x1="50%" y1="0%" x2="50%" y2="100%" {...props}>
        <Stop
          stopColor={isNegative ? '#FF0000' : '#53C26E'}
          offset="0%"
          stopOpacity="0.5"
        />
        <Stop stopColor={theme.background} offset="100%" stopOpacity="0.1" />
      </LinearGradient>
    )
  }

  return (
    <SlideAreaChart
      style={{
        backgroundColor: theme.transparent
      }}
      width={width}
      height={height}
      animated={animated}
      data={data}
      paddingBottom={16}
      alwaysShowIndicator={true}
      chartLineColor={negative ? theme.colorError : theme.colorSuccess}
      chartLineWidth={interactive ? 2 : 1}
      cursorProps={{
        displayCursor: interactive,
        cursorMarkerHeight: 12,
        cursorMarkerWidth: 12,
        cursorColor: theme.alternateBackground,
        cursorBorderColor: theme.alternateBackground
      }}
      toolTipProps={{
        displayToolTip: interactive,
        borderRadius: 20,
        toolTipTextRenderers: [
          ({ scaleY, y }) => ({
            text: currencyFormatter(scaleY.invert(y).toFixed(6).toString())
          })
        ]
      }}
      yAxisProps={{
        horizontalLineColor: theme.transparent,
        verticalLineColor: theme.transparent,
        interval: 1
      }}
      yRange={yRange}
      xRange={xRange}
      renderFillGradient={props =>
        defaultAreaChartFillGradient(props, negative)
      }
    />
  )
}

export default SparklineChart
