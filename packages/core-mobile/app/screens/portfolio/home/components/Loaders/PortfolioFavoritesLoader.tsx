import React from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { Dimensions, View } from 'react-native'
import { useSkeletonColors } from 'hooks/colors/useSkeletonColors'
import { useTheme } from '@avalabs/k2-mobile'

const deviceWidth = Dimensions.get('screen').width
const aspectRatio = 359 / 100

export const PortfolioFavoritesLoader = (): JSX.Element => {
  const { backgroundColor, foregroundColor } = useSkeletonColors()
  const {
    theme: { colors }
  } = useTheme()

  return (
    <View
      style={{
        marginTop: 16,
        alignItems: 'center',
        width: deviceWidth - 16,
        aspectRatio: aspectRatio,
        backgroundColor: colors.$black
      }}>
      <ContentLoader
        speed={1}
        width="100%"
        height="100%"
        viewBox="0 0 359 100"
        backgroundColor={backgroundColor}
        foregroundColor={foregroundColor}>
        <Rect x="0" y="0" rx="8" ry="8" width="72" height="96" />
        <Rect x="80" y="0" rx="8" ry="8" width="72" height="96" />
        <Rect x="160" y="0" rx="8" ry="8" width="72" height="96" />
        <Rect x="240" y="0" rx="8" ry="8" width="72" height="96" />
        <Rect x="320" y="0" rx="8" ry="8" width="76" height="96" />
      </ContentLoader>
    </View>
  )
}
