import React, { FC, useMemo } from 'react'

import { Canvas, Path, Shadow, Skia } from '@shopify/react-native-skia'
import { PixelRatio, StyleSheet, View } from 'react-native'
import AvaLogoSVG from 'components/svg/AvaLogoSVG'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { StakingBalanceType } from 'services/earn/types'
import { getStakePrimaryColor, getStakeShadowColor } from '../utils'

const radius = PixelRatio.roundToNearestPixel(48)
const strokeWidth = 5
const shadowWidth = 8
const innerRadius = radius - strokeWidth - shadowWidth / 2
const path = Skia.Path.Make()
path.addCircle(radius, radius, innerRadius)

interface CircularProgressProps {
  data: StakingBalanceType[]
}

export const CircularProgress: FC<CircularProgressProps> = ({ data }) => {
  const { theme } = useApplicationContext()

  let start = 0
  let end = 0
  const total = useMemo(() => {
    return data.reduce((item, acc) => {
      item += acc.amount
      return item
    }, 0)
  }, [data])

  return (
    <View style={styles.container}>
      <Canvas style={styles.chartContainer}>
        {data.map((item, index) => {
          const strokeColor = getStakePrimaryColor(item.type, theme)
          const shadowColor = getStakeShadowColor(item.type, theme)
          const amountPercent = item.amount / total

          // This will calculate the start and end of each section of the the circular path
          if (index !== 0) {
            const startPercent = (data[index - 1]?.amount || 0) / total
            start = start + Number(startPercent.toFixed(2))
          }
          end = end + Number(amountPercent.toFixed(2))

          const startPath = isNaN(start) ? 0 : start
          const endPath = isNaN(end) ? 0 : end

          return (
            <Path
              path={path}
              key={item.type}
              color={strokeColor}
              style="stroke"
              strokeJoin="round"
              strokeWidth={strokeWidth}
              strokeCap="round"
              start={index === 0 ? 0 : startPath}
              end={endPath}>
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
