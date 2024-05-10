import React from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { Dimensions, View } from 'react-native'
import { useSkeletonColors } from 'hooks/colors/useSkeletonColors'
import { useTheme } from '@avalabs/k2-mobile'

const deviceWidth = Dimensions.get('screen').width
const aspectRatio = 359 / 518

export const PortfolioActiveTokensLoader = (): JSX.Element => {
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
        viewBox="0 0 359 518"
        backgroundColor={backgroundColor}
        foregroundColor={foregroundColor}>
        <Rect x="0" y="0" rx="8" ry="8" width="343" height="518" />
      </ContentLoader>
    </View>
  )
}
