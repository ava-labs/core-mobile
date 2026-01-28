import { ActivityIndicator, View } from 'dripsy'
import React, { useCallback, useEffect } from 'react'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated'

import { Pressable } from 'react-native'
import { useTheme } from '../../hooks'
import { Icons } from '../../theme/tokens/Icons'
import { showAlert } from '../Alert/Alert'
import { ShowAlertConfig } from '../Alert/types'

interface LoadingContentProps {
  isLoading?: boolean
  children: React.ReactNode
  hideSpinner?: boolean
  hasError?: boolean
  minOpacity?: number
  maxOpacity?: number
  alertOptions?: ShowAlertConfig
  renderError?: () => React.ReactNode
}

export const LoadingContent = ({
  isLoading,
  children,
  hideSpinner = false,
  hasError = false,
  minOpacity = 0.3,
  maxOpacity = 0.5,
  alertOptions
}: LoadingContentProps): JSX.Element => {
  const { theme } = useTheme()

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(isLoading && !hideSpinner ? 20 : 0, {
        duration: 300
      }),
      opacity: withTiming(isLoading && !hideSpinner ? 1 : 0, {
        duration: 300
      })
    }
  })

  const errorIndicatorStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isLoading ? 0 : 1, {
        duration: 300
      }),
      left: withTiming(isLoading ? 28 : -28, {
        duration: 300
      })
    }
  })

  const onErrorPress = useCallback(() => {
    if (alertOptions) {
      showAlert(alertOptions)
    }
  }, [alertOptions])

  return (
    <View
      testID={isLoading ? 'loading_spinner_visible' : 'loading_spinner_hidden'}
      style={{
        gap: 8,
        flexDirection: 'row',
        alignItems: 'center'
      }}>
      <Animated.View
        style={[
          { position: 'absolute', left: 0, justifyContent: 'center' },
          indicatorStyle
        ]}>
        <ActivityIndicator size="small" color={theme.colors.$textPrimary} />
      </Animated.View>
      {hasError && (
        <Animated.View
          style={[
            { justifyContent: 'center', position: 'absolute' },
            errorIndicatorStyle
          ]}>
          <Pressable onPress={onErrorPress}>
            <Icons.Alert.Error
              color={theme.colors.$textDanger}
              width={14}
              height={14}
            />
          </Pressable>
        </Animated.View>
      )}
      <LoadingFadeInOut
        minOpacity={minOpacity}
        maxOpacity={maxOpacity}
        isLoading={isLoading ?? false}>
        {children}
      </LoadingFadeInOut>
    </View>
  )
}

export const LoadingFadeInOut = ({
  isLoading,
  minOpacity = 0.3,
  maxOpacity = 0.5,
  paddingLeft = 28,
  children
}: {
  isLoading: boolean
  minOpacity?: number
  maxOpacity?: number
  paddingLeft?: number
  children: React.ReactNode
}): JSX.Element => {
  const opacity = useSharedValue(maxOpacity)

  useEffect(() => {
    if (isLoading) {
      opacity.value = withRepeat(
        withTiming(minOpacity, { duration: 800 }),
        -1,
        true
      )
    } else {
      opacity.value = withTiming(1, { duration: 500 })
    }
  }, [isLoading, maxOpacity, minOpacity, opacity])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      paddingLeft: withTiming(isLoading ? paddingLeft : 0, {
        duration: 300
      })
    }
  })

  return <Animated.View style={animatedStyle}>{children}</Animated.View>
}
