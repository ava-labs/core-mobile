import React, { memo } from 'react'
import { Text, View } from '../Primitives'

export const NavigationTitleHeader = memo(
  ({ title, subtitle }: { title: string; subtitle?: string }): JSX.Element => {
    return (
      <View style={[{ alignItems: 'center' }]}>
        <Text
          numberOfLines={1}
          sx={{
            fontSize: 17,
            lineHeight: 20,
            fontFamily: 'Inter-SemiBold',
            maxWidth: 200
          }}>
          {title}
        </Text>
        {subtitle && (
          <Text
            numberOfLines={1}
            variant="caption"
            sx={{ color: '$textSecondary' }}>
            {subtitle}
          </Text>
        )}
      </View>
    )
  },
  (prevProps, nextProps) =>
    prevProps.title === nextProps.title &&
    prevProps.subtitle === nextProps.subtitle
)
