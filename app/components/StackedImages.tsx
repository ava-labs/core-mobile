import React from 'react'
import { Image } from 'react-native'
import { Row } from './Row'

export interface StackedImagesProps {
  imageUrls: string[]
  size?: number
  borderRadius?: number
  flexDirection?: 'row' | 'column'
  stackMargin?: number
}

export const StackedImages = ({
  imageUrls,
  size = 24,
  borderRadius = size / 2,
  flexDirection = 'row',
  stackMargin = 0.4
}: StackedImagesProps) => {
  const stackedMargin = (index: number) => {
    if (index === 0) return undefined
    return flexDirection === 'row'
      ? { marginLeft: -size * stackMargin }
      : { marginTop: -size * stackMargin }
  }

  return (
    <Row
      style={{
        flexDirection
      }}>
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
              stackedMargin(index)
            ]}
            key={index}
          />
        )
      })}
    </Row>
  )
}
