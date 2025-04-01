import React from 'react'
import { View, Text, useTheme, useInversedTheme } from '@avalabs/k2-alpine'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { Animated, StyleProp, ViewStyle } from 'react-native'

export const TestnetBanner = ({
  overlayStyle
}: {
  overlayStyle: Animated.WithAnimatedValue<StyleProp<ViewStyle>>
}): JSX.Element => {
  const { theme } = useTheme()
  const { theme: inversedTheme } = useInversedTheme(theme)
  const isDeveloperModeEnabled = useSelector(selectIsDeveloperMode)

  return (
    <View
      testID="testnetBanner"
      style={{
        backgroundColor: 'transparent',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}>
      <View
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'black',
          opacity: 0.5,
          overflow: 'hidden'
        }}
      />
      {isDeveloperModeEnabled && (
        <Animated.View
          style={[
            {
              height: 36,
              width: 200,
              top: 70,
              alignSelf: 'center',
              borderRadius: 25,
              backgroundColor: 'white',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1
            },
            overlayStyle,
            {
              opacity: 1
            }
          ]}>
          <Text
            variant="body2"
            style={{ color: inversedTheme.colors.$textPrimary }}>
            Testnet mode is now on
          </Text>
        </Animated.View>
      )}
    </View>
  )
}
