import React from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { Dimensions, View } from 'react-native'
import { useSkeletonColors } from 'hooks/colors/useSkeletonColors'

const deviceWidth = Dimensions.get('screen').width
const aspectRatio = 382 / 584

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
        viewBox="0 0 382 584"
        backgroundColor={backgroundColor}
        foregroundColor={foregroundColor}>
        <Rect x="0" y="38" rx="6" ry="6" width="382" height="64" />
        <Rect x="0" y="110" rx="6" ry="6" width="382" height="64" />
        <Rect x="0" y="182" rx="6" ry="6" width="382" height="64" />
        <Rect x="0" y="254" rx="6" ry="6" width="382" height="64" />
        <Rect x="0" y="376" rx="6" ry="6" width="382" height="64" />
        <Rect x="0" y="448" rx="6" ry="6" width="382" height="64" />
        <Rect x="0" y="520" rx="6" ry="6" width="382" height="64" />
        <Rect x="0" y="0" rx="6" ry="6" width="97" height="17" />
        <Rect x="0" y="338" rx="6" ry="6" width="97" height="17" />
      </ContentLoader>
    </View>
  )
}
