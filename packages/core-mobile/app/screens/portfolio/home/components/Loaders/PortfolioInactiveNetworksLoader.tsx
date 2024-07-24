import React from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { Dimensions, View } from 'react-native'
import { useSkeletonColors } from 'hooks/colors/useSkeletonColors'
import { useTheme } from '@avalabs/k2-mobile'

const deviceWidth = Dimensions.get('screen').width
const aspectRatio = 359 / 250

export const PortfolioInactiveNetworksLoader = (): JSX.Element => {
  const { backgroundColor, foregroundColor } = useSkeletonColors()
  const {
    theme: { colors }
  } = useTheme()

  return (
    <View
      style={{
        alignItems: 'center',
        width: deviceWidth - 16,
        aspectRatio: aspectRatio,
        backgroundColor: colors.$black
      }}>
      <ContentLoader
        speed={1}
        width="100%"
        height="100%"
        viewBox="0 0 359 250"
        backgroundColor={backgroundColor}
        foregroundColor={foregroundColor}>
        <Rect x="0" y="0" rx="8" ry="8" width="164" height="87" />
        <Rect x="180" y="0" rx="8" ry="8" width="164" height="87" />
        <Rect x="0" y="103" rx="8" ry="8" width="164" height="87" />
        <Rect x="180" y="103" rx="8" ry="8" width="168" height="87" />
      </ContentLoader>
    </View>
  )
}
