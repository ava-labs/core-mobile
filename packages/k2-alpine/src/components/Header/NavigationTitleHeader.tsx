import React, { memo } from 'react'
import { Text, View } from '../Primitives'
import { MaskedText } from '../MaskedText/MaskedText'

export const NavigationTitleHeader = memo(
  ({
    title,
    subtitle,
    shouldMaskSubtitle = false
  }: {
    title: string
    subtitle?: string
    shouldMaskSubtitle?: boolean
  }): JSX.Element => {
    return (
      <View style={[{ alignItems: 'center' }]}>
        <Text
          numberOfLines={1}
          sx={{
            fontSize: 17,
            lineHeight: 20,
            fontFamily: 'Inter-SemiBold',
            maxWidth: 250
          }}>
          {title}
        </Text>
        {subtitle && (
          <MaskedText
            numberOfLines={1}
            variant="caption"
            sx={{ color: '$textSecondary' }}
            shouldMask={shouldMaskSubtitle}>
            {subtitle}
          </MaskedText>
        )}
      </View>
    )
  },
  (prevProps, nextProps) =>
    prevProps.title === nextProps.title &&
    prevProps.subtitle === nextProps.subtitle &&
    prevProps.shouldMaskSubtitle === nextProps.shouldMaskSubtitle
)
