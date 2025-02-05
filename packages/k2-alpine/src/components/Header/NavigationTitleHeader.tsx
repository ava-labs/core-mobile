import React from 'react'
import { Text, View } from '../Primitives'

export const NavigationTitleHeader = ({
  title,
  subtitle
}: {
  title: string
  subtitle?: string
}): JSX.Element => {
  return (
    <View style={[{ alignItems: 'center' }]}>
      <Text sx={{ fontSize: 17, lineHeight: 20, fontFamily: 'Inter-SemiBold' }}>
        {title}
      </Text>
      {subtitle && (
        <Text variant="caption" sx={{ color: '$textSecondary' }}>
          {subtitle}
        </Text>
      )}
    </View>
  )
}
