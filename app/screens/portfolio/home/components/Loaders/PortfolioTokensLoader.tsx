import React from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { Dimensions, View } from 'react-native'
import { useSkeletonColors } from 'hooks/colors/useSkeletonColors'

const deviceWidth = Dimensions.get('screen').width
const aspectRatio = 359 / 518

export const PortfolioTokensLoader = () => {
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
        <Rect x="0" y="192" rx="8" ry="8" width="343" height="120" />
        <Rect x="0" y="40" rx="8" ry="8" width="72" height="96" />
        <Rect x="80" y="40" rx="8" ry="8" width="72" height="96" />
        <Rect x="160" y="40" rx="8" ry="8" width="72" height="96" />
        <Rect x="240" y="40" rx="8" ry="8" width="72" height="96" />
        <Rect x="0" y="152" rx="8" ry="8" width="96" height="24" />
        <Rect x="0" y="0" rx="8" ry="8" width="96" height="24" />
        <Rect x="0" y="328" rx="8" ry="8" width="164" height="87" />
        <Rect x="0" y="431" rx="8" ry="8" width="164" height="87" />
        <Rect x="175" y="328" rx="8" ry="8" width="168" height="87" />
        <Rect x="175" y="431" rx="8" ry="8" width="168" height="87" />
        <Rect x="320" y="40" rx="8" ry="8" width="76" height="96" />
      </ContentLoader>
    </View>
  )
}
