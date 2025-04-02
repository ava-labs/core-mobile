import { Button, SxProp, Text, View } from '@avalabs/k2-alpine'
import React from 'react'

export const Placeholder = ({
  icon,
  title,
  description,
  button,
  sx
}: {
  icon: JSX.Element
  title: string
  description?: string
  button?: {
    title: string
    onPress: () => void
  }
  sx?: SxProp
}): React.JSX.Element => {
  return (
    <View
      sx={{
        justifyContent: 'center',
        alignItems: 'center',
        ...sx
      }}>
      <View sx={{ width: '100%', alignItems: 'center' }}>
        {icon}
        <Text
          variant="heading6"
          sx={{ color: '$textPrimary', marginTop: 32, textAlign: 'center' }}>
          {title}
        </Text>
        {description && (
          <Text
            variant="body2"
            sx={{
              color: '$textSecondary',
              fontSize: 12,
              lineHeight: 16,
              marginTop: 8,
              textAlign: 'center',
              marginHorizontal: 55
            }}>
            {description}
          </Text>
        )}
        {button && (
          <View>
            <Button
              size="medium"
              type="secondary"
              style={{ marginTop: 16 }}
              onPress={button.onPress}>
              {button.title}
            </Button>
          </View>
        )}
      </View>
    </View>
  )
}
