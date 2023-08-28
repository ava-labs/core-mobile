import React from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { Dimensions, View } from 'react-native'
import { useSkeletonColors } from 'hooks/colors/useSkeletonColors'

const deviceWidth = Dimensions.get('screen').width
const aspectRatio = 359 / 518

export const PortfolioDeFiDetailsLoader = () => {
  const { backgroundColor, foregroundColor } = useSkeletonColors()

  return (
    <View
      style={{
        alignItems: 'center',
        width: deviceWidth - 16,
        aspectRatio: aspectRatio,
        marginTop: 14,
        marginLeft: 16
      }}>
      <ContentLoader
        speed={1}
        width="100%"
        height="100%"
        viewBox="0 0 359 518"
        backgroundColor={backgroundColor}
        foregroundColor={foregroundColor}>
        <Rect x="0" y="8" rx="8" ry="8" width="343" height="357" />
        <Rect x="16" y="24" rx="8" ry="8" width="311" height="56" />
        <Rect x="16" y="96" rx="8" ry="8" width="311" height="1" />
        <Rect x="16" y="113" rx="8" ry="8" width="106" height="24" />
        <Rect x="16" y="153" rx="8" ry="8" width="311" height="176" />
      </ContentLoader>
    </View>
  )
}
