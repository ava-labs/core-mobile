import React, { FC } from 'react'

import { Canvas, Path, Shadow, Skia } from '@shopify/react-native-skia'
import { PixelRatio, StyleSheet, View } from 'react-native'
import AvaLogoSVG from 'components/svg/AvaLogoSVG'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { StakeTypeEnum } from '../StakeDashboard'
import { getStakePrimaryColor, getStakeShadowColor } from '../utils'

interface CircularProgressProps {
  data: Record<string, { type: StakeTypeEnum; amount: number }>
}

export const CircularProgress: FC<CircularProgressProps> = ({ data }) => {
  const { theme } = useApplicationContext()
  const radius = PixelRatio.roundToNearestPixel(40)
  const strokeWidth = 5

  const innerRadius = radius - strokeWidth / 2
  const path = Skia.Path.Make()
  path.addCircle(radius, radius, innerRadius)

  const dataArray = Object.values(data)

  let start = 0
  let end = 0
  const total = dataArray.reduce((item, acc) => {
    item += acc.amount
    return item
  }, 0)

  return (
    <View style={styles.container}>
      <Canvas style={styles.chartContainer}>
        {dataArray.map((item, index) => {
          const strokeColor = getStakePrimaryColor(item.type, theme)
          const shadowColor = getStakeShadowColor(item.type, theme)
          const amountPercent = item.amount / total

          // This will calculate the the start and end of each section of the the circular path
          end = end + Number(amountPercent.toFixed(2))

          if (index !== 0) {
            const startPercent = (dataArray[index - 1]?.amount || 0) / total
            start = start + Number(startPercent.toFixed(2))
          }

          return (
            <Path
              path={path}
              key={item.type}
              color={strokeColor}
              style="stroke"
              strokeJoin="round"
              strokeWidth={strokeWidth}
              strokeCap="round"
              start={index === 0 ? 0 : start}
              end={end}>
              <Shadow dx={-1} dy={-1} color={shadowColor} blur={3} />
            </Path>
          )
        })}
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
