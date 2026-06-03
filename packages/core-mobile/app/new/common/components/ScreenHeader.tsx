import { SxProp, Text, View } from '@avalabs/k2-alpine'
import React from 'react'

export default function ScreenHeader({
  title,
  titleSx,
  titleNumberOfLines,
  description
}: {
  title: string
  titleSx?: SxProp
  titleNumberOfLines?: number
  description?: string | JSX.Element
}): JSX.Element {
  return (
    <View style={{ marginRight: 10, marginTop: 8, marginBottom: 16 }}>
      <Text
        sx={{
          ...titleSx
        }}
        numberOfLines={titleNumberOfLines}
        variant="heading2">
        {title}
      </Text>
      {description !== undefined && (
        <View sx={{ marginTop: 6 }}>
          {typeof description === 'string' ? (
            <Text variant="subtitle1">{description}</Text>
          ) : (
            description
          )}
        </View>
      )}
    </View>
  )
}
