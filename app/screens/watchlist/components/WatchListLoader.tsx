import React from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { Dimensions, View } from 'react-native'
import { useSkeletonColors } from 'hooks/colors/useSkeletonColors'

const deviceWidth = Dimensions.get('screen').width
const aspectRatio = 382 / 507

export const WatchlistLoader = () => {
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
        viewBox="0 0 382 507"
        backgroundColor={backgroundColor}
        foregroundColor={foregroundColor}>
        <Rect x="0" y="64" rx="6" ry="6" width="382" height="56" />
        <Rect x="0" y="0" rx="6" ry="6" width="382" height="56" />
        <Rect x="0" y="129" rx="6" ry="6" width="382" height="56" />
        <Rect x="0" y="193" rx="6" ry="6" width="382" height="56" />
        <Rect x="0" y="258" rx="6" ry="6" width="382" height="56" />
        <Rect x="0" y="322" rx="6" ry="6" width="382" height="56" />
        <Rect x="0" y="387" rx="6" ry="6" width="382" height="56" />
        <Rect x="0" y="451" rx="6" ry="6" width="382" height="56" />
      </ContentLoader>
    </View>
  )
}
