import React, { FC } from 'react'

import { Canvas, Path, Shadow, Skia } from '@shopify/react-native-skia'
import { PixelRatio, StyleSheet, View } from 'react-native'
import AvaLogoSVG from 'components/svg/AvaLogoSVG'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface DonutChartProps {
  availableAmount: number
  stakedAmount: number
  claimableAmount: number
}

export const DonutChart: FC<DonutChartProps> = ({
  availableAmount,
  claimableAmount,
  stakedAmount
}) => {
  const { theme } = useApplicationContext()
  const radius = PixelRatio.roundToNearestPixel(40)
  const strokeWidth = 5

  const innerRadius = radius - strokeWidth / 2
  const path = Skia.Path.Make()
  path.addCircle(radius, radius, innerRadius)

  const total = availableAmount + stakedAmount + claimableAmount

  const availablePercentage = availableAmount / total
  const stakedPercentage = stakedAmount / total

  return (
    <View style={styles.container}>
      <Canvas style={styles.chartContainer}>
        <Path
          path={path}
          color={theme.blueDark}
          style="stroke"
          strokeJoin="round"
          strokeWidth={strokeWidth}
          strokeCap="round"
          start={0}
          end={availablePercentage}>
          <Shadow dx={-1} dy={-1} color={theme.colorPrimary1} blur={3} />
        </Path>
        <Path
          path={path}
          color={theme.pieChartWhiteStroke}
          style="stroke"
          strokeJoin="round"
          strokeWidth={strokeWidth}
          strokeCap="round"
          start={availablePercentage}
          end={stakedPercentage}>
          <Shadow dx={-1} dy={-1} color={theme.pieChartWhiteStroke} blur={3} />
        </Path>
        <Path
          path={path}
          color={theme.colorSuccess}
          style="stroke"
          strokeJoin="round"
          strokeWidth={strokeWidth}
          strokeCap="round"
          start={stakedPercentage}
          end={1}>
          <Shadow dx={-1} dy={-1} color={theme.colorSuccess} blur={3} />
        </Path>
      </Canvas>
      <View style={styles.iconContainer}>
        <AvaLogoSVG
          size={48}
          logoColor={theme.tokenLogoColor}
          backgroundColor={theme.tokenLogoBg}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1
  },
  iconContainer: {
    position: 'absolute',
    textAlignVertical: 'center'
  },
  chartContainer: {
    height: 80,
    width: 80
  }
})
