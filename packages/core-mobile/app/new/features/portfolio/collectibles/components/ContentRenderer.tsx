import { Icons, View } from '@avalabs/k2-alpine'
import { Image } from 'expo-image'
import React from 'react'
import { ViewStyle } from 'react-native'

export const ContentRenderer = ({
  style,
  imageUrl,
  videoUrl
}: {
  style?: ViewStyle
  imageUrl?: string
  videoUrl?: string
}): JSX.Element | JSX.Element[] => {
  return (
    <View
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        ...style
      }}>
      <Image
        key={imageUrl}
        recyclingKey={imageUrl}
        style={{
          flex: 1,
          width: '100%',
          borderRadius: 18,
          position: 'absolute',
          zIndex: 1,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
        source={imageUrl}
        contentFit="cover"
      />

      <Icons.Content.HideImage width={24} height={24} />
    </View>
  )
}
