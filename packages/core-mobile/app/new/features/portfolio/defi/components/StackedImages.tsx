import React, { useCallback } from 'react'
import { Image, ImageStyle, StyleProp, View } from 'react-native'

interface StackedImagesProps {
  imageUrls: string[]
  size?: number
  borderRadius?: number
  flexDirection?: 'row' | 'column'
  stackMarginRatio?: number
  style?: StyleProp<ImageStyle>
}

export const StackedImages = ({
  imageUrls,
  size = 24,
  borderRadius = size / 2,
  flexDirection = 'row',
  stackMarginRatio = 0.4,
  style
}: StackedImagesProps): JSX.Element => {
  const stackedMargin = useCallback(
    (index: number) => {
      if (index === 0) return undefined
      return flexDirection === 'row'
        ? { marginLeft: -size * stackMarginRatio }
        : { marginTop: -size * stackMarginRatio }
    },
    [flexDirection, size, stackMarginRatio]
  )

  return (
    <View style={{ flexDirection }}>
      {imageUrls.map((uri, index) => {
        return (
          <Image
            source={{ uri }}
            style={[
              {
                width: size,
                height: size,
                borderRadius
              },
              stackedMargin(index),
              style
            ]}
            key={index}
          />
        )
      })}
    </View>
  )
}
