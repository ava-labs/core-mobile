import React from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { Dimensions, View } from 'react-native'
import { useSkeletonColors } from 'hooks/colors/useSkeletonColors'

const deviceWidth = Dimensions.get('screen').width
const aspectRatio = 343 / 519

export const ActivityLoader = () => {
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
        viewBox="0 0 343 519"
        backgroundColor={backgroundColor}
        foregroundColor={foregroundColor}>
        <Rect x="0" y="40" rx="8" ry="8" width="343" height="64" />
        <Rect x="0" y="112" rx="8" ry="8" width="343" height="64" />
        <Rect x="0" y="184" rx="8" ry="8" width="343" height="64" />
        <Rect x="0" y="311" rx="8" ry="8" width="343" height="64" />
        <Rect x="0" y="383" rx="8" ry="8" width="343" height="64" />
        <Rect x="0" y="455" rx="8" ry="8" width="343" height="64" />
        <Rect x="0" y="0" rx="8" ry="8" width="96" height="24" />
        <Rect x="0" y="271" rx="8" ry="8" width="96" height="24" />
      </ContentLoader>
    </View>
  )
}
