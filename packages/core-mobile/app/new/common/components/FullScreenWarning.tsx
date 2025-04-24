import React from 'react'
import { useTheme, Text, View, Button } from '@avalabs/k2-alpine'
import CoreAppIconLight from '../../assets/icons/core-app-icon-light.svg'
import CoreAppIconDark from '../../assets/icons/core-app-icon-dark.svg'

export const FullScreenWarning = ({
  title,
  description,
  action
}: {
  title: React.ReactNode
  description: string
  action: {
    label: string
    onPress: () => void
  }
}): JSX.Element => {
  const {
    theme: { isDark }
  } = useTheme()

  return (
    <View
      sx={{
        backgroundColor: '$surfacePrimary',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      <View>
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          <View style={{ marginBottom: 28 }}>
            {isDark ? <CoreAppIconLight /> : <CoreAppIconDark />}
            <View
              style={{
                position: 'absolute',
                bottom: -15,
                right: -14
              }}>
              <Text variant="heading6" sx={{ fontSize: 36, lineHeight: 44 }}>
                ⚠️
              </Text>
            </View>
          </View>
        </View>
        <View style={{ width: '60%' }}>
          <Text variant="heading6" sx={{ textAlign: 'center' }}>
            {title}
          </Text>
          <Text
            variant="body2"
            sx={{
              textAlign: 'center',
              fontSize: 12,
              lineHeight: 16,
              marginTop: 8,
              marginBottom: 15
            }}>
            {description}
          </Text>
        </View>
      </View>
      <View style={{ paddingHorizontal: 0 }}>
        <Button type="secondary" size="medium" onPress={action.onPress}>
          {action.label}
        </Button>
      </View>
    </View>
  )
}
