import React from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { Dimensions, View } from 'react-native'
import { useSkeletonColors } from 'hooks/colors/useSkeletonColors'

const deviceWidth = Dimensions.get('screen').width
const aspectRatio = 343 / 512

export const NftGridLoader = () => {
  const { backgroundColor, foregroundColor } = useSkeletonColors()

  return (
    <View
      style={{
        alignItems: 'center',
        width: deviceWidth - 32,
        aspectRatio: aspectRatio,
        marginTop: 6
      }}>
      <ContentLoader
        speed={1}
        width="100%"
        height="100%"
        viewBox="0 0 343 512"
        backgroundColor={backgroundColor}
        foregroundColor={foregroundColor}>
        <Rect x="0" y="0" rx="8" ry="8" width="163" height="248" />
        <Rect x="0" y="264" rx="8" ry="8" width="163" height="248" />
        <Rect x="183" y="0" rx="8" ry="8" width="160" height="248" />
        <Rect x="183" y="264" rx="8" ry="8" width="160" height="248" />
      </ContentLoader>
    </View>
  )
}
