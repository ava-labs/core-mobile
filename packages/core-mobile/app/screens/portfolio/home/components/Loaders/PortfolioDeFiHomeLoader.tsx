import React from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { Dimensions, View } from 'react-native'
import { useSkeletonColors } from 'hooks/colors/useSkeletonColors'

const deviceWidth = Dimensions.get('screen').width
const aspectRatio = 359 / 518

export const PortfolioDeFiHomeLoader = () => {
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
        <Rect x="0" y="8" rx="8" ry="8" width="343" height="72" />
        <Rect x="0" y="88" rx="8" ry="8" width="343" height="72" />
        <Rect x="0" y="168" rx="8" ry="8" width="343" height="72" />
        <Rect x="0" y="248" rx="8" ry="8" width="343" height="72" />
        <Rect x="0" y="328" rx="8" ry="8" width="343" height="72" />
        <Rect x="0" y="408" rx="8" ry="8" width="343" height="72" />
        <Rect x="0" y="488" rx="8" ry="8" width="343" height="72" />
      </ContentLoader>
    </View>
  )
}
