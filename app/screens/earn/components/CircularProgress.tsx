import React, { FC } from 'react'

import { Canvas, Path, Shadow, Skia } from '@shopify/react-native-skia'
import { PixelRatio, StyleSheet, View } from 'react-native'
import AvaLogoSVG from 'components/svg/AvaLogoSVG'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { StakingBalanceType } from 'services/earn/types'
import { getStakePrimaryColor, getStakeShadowColor } from '../utils'

interface CircularProgressProps {
  data: StakingBalanceType[]
}

export const CircularProgress: FC<CircularProgressProps> = ({ data }) => {
  const { theme } = useApplicationContext()
  const radius = PixelRatio.roundToNearestPixel(48)
  const strokeWidth = 5
  const shadowWidth = 8

  const innerRadius = radius - strokeWidth - shadowWidth / 2
  const path = Skia.Path.Make()
  path.addCircle(radius, radius, innerRadius)

  let start = 0
  let end = 0
  const total = data.reduce((item, acc) => {
    item += acc.amount
    return item
  }, 0)

  return (
    <View style={styles.container}>
      <Canvas style={styles.chartContainer}>
        {data.map((item, index) => {
          const strokeColor = getStakePrimaryColor(item.type, theme)
          const shadowColor = getStakeShadowColor(item.type, theme)
          const amountPercent = item.amount / total

          // This will calculate the start and end of each section of the the circular path
          end = end + Number(amountPercent.toFixed(2))

          if (index !== 0) {
            const startPercent = (data[index - 1]?.amount || 0) / total
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
              <Shadow
                dx={-1}
                dy={-1}
                color={shadowColor}
                blur={shadowWidth / 2}
              />
              <Shadow dx={0.5} dy={0.5} color={theme.neutralBlack} blur={1} />
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
    alignItems: 'center'
  },
  iconContainer: {
    position: 'absolute'
  },
  chartContainer: {
    height: 96,
    width: 96
  }
})
