import React, { memo } from 'react'
import { MaskedText } from '../MaskedText/MaskedText'
import { Text, View } from '../Primitives'

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
      <View>
        <Text
          numberOfLines={1}
          sx={{
            fontSize: 17,
            lineHeight: 20,
            fontFamily: 'Inter-SemiBold',
            textAlign: 'center'
          }}>
          {title}
        </Text>
        {subtitle && (
          <MaskedText
            numberOfLines={1}
            variant="caption"
            sx={{ color: '$textSecondary', textAlign: 'center' }}
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
