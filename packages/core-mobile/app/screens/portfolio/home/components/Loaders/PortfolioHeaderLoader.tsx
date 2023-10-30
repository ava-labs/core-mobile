import React from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { Dimensions, View } from 'react-native'
import { useSkeletonColors } from 'hooks/colors/useSkeletonColors'

const deviceWidth = Dimensions.get('screen').width
const aspectRatio = 279 / 56

export const PortfolioHeaderLoader = () => {
  const { backgroundColor, foregroundColor } = useSkeletonColors()

  return (
    <View
      style={{
        width: deviceWidth * 0.744,
        aspectRatio: aspectRatio
      }}>
      <ContentLoader
        speed={1}
        width="100%"
        height="100%"
        viewBox="0 0 279 56"
        backgroundColor={backgroundColor}
        foregroundColor={foregroundColor}>
        <Rect x="0" y="0" rx="8" ry="8" width="279" height="56" />
      </ContentLoader>
    </View>
  )
}
