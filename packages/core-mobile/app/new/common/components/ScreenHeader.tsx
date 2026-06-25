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
  const hasTitle = Boolean(title)
  return (
    <View style={{ marginRight: 10, marginTop: 8, marginBottom: 16 }}>
      {hasTitle && (
        <Text
          sx={{
            ...titleSx
          }}
          numberOfLines={titleNumberOfLines}
          variant="heading2">
          {title}
        </Text>
      )}
      {description !== undefined && (
        <View sx={{ marginTop: hasTitle ? 6 : 0 }}>
          {typeof description === 'string' ? (
            <Text variant="subtitle1" sx={{ color: '$textSecondary' }}>
              {description}
            </Text>
          ) : (
            description
          )}
        </View>
      )}
    </View>
  )
}
