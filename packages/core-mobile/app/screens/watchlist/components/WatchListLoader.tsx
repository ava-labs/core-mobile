import React from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { Dimensions, View } from 'react-native'
import { useSkeletonColors } from 'hooks/colors/useSkeletonColors'

const deviceWidth = Dimensions.get('screen').width
const aspectRatio = 343 / 416

export const WatchListLoader = () => {
  const { backgroundColor, foregroundColor } = useSkeletonColors()

  return (
    <View
      style={{
        alignItems: 'center',
        width: deviceWidth,
        aspectRatio: aspectRatio,
        paddingHorizontal: 16,
        marginTop: -6
      }}>
      <ContentLoader
        speed={1}
        width="100%"
        height="100%"
        viewBox="0 0 343 416"
        backgroundColor={backgroundColor}
        foregroundColor={foregroundColor}>
        <Rect x="0" y="0" rx="8" ry="8" width="343" height="56" />
        <Rect x="0" y="72" rx="8" ry="8" width="343" height="56" />
        <Rect x="0" y="144" rx="8" ry="8" width="343" height="56" />
        <Rect x="0" y="216" rx="8" ry="8" width="343" height="56" />
        <Rect x="0" y="288" rx="8" ry="8" width="343" height="56" />
        <Rect x="0" y="360" rx="8" ry="8" width="343" height="56" />
      </ContentLoader>
    </View>
  )
}
