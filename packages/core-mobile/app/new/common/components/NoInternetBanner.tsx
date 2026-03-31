import {
  alpha,
  ANIMATED,
  Icons,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useNetworkConnectivity } from 'common/hooks/useNetworkConnectivity'
import React from 'react'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const CONTENT_HEIGHT = 56

export const NoInternetBanner = (): JSX.Element => {
  const { theme } = useTheme()
  const isConnected = useNetworkConnectivity()
  const insets = useSafeAreaInsets()

  const containerStyle = useAnimatedStyle(() => ({
    height: withTiming(
      isConnected ? 0 : insets.top + CONTENT_HEIGHT,
      ANIMATED.TIMING_CONFIG
    )
  }))

  return (
    <Animated.View style={containerStyle}>
      <View
        sx={{
          paddingTop: insets.top,
          justifyContent: 'center',
          backgroundColor: alpha(theme.colors.$textDanger, 0.2)
        }}>
        <View
          sx={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: 16,
            borderRadius: 16
          }}>
          <Icons.Alert.ErrorOutline
            color={theme.colors.$textDanger}
            width={24}
            height={24}
          />
          <Text
            variant="buttonSmall"
            style={{ color: theme.colors.$textDanger }}>
            No internet connection
          </Text>
        </View>
      </View>
    </Animated.View>
  )
}
