import React, { useEffect, useCallback } from 'react'
import { TouchableWithoutFeedback, ViewStyle } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat
} from 'react-native-reanimated'
import { Icons } from '../../theme/tokens/Icons'
import { alpha } from '../../utils'
import { darkModeColors, lightModeColors } from '../../theme/tokens/colors'
import { Text, View } from '../Primitives'
import { useTheme } from '../../hooks'
import { SCREEN_WIDTH } from '../../const'

export type TransactionSnackbarType = 'pending' | 'success' | 'error'

type TransactionSnackbarProps = {
  message?: string
  type: TransactionSnackbarType
  testID?: string
  onPress?: () => void
  isActionable?: boolean
  style?: ViewStyle
}

export const TransactionSnackbar = ({
  message,
  type,
  testID,
  onPress,
  isActionable = false,
  style
}: TransactionSnackbarProps): JSX.Element | null => {
  const { theme } = useTheme()

  const backgroundColor = theme.isDark
    ? lightModeColors.$surfacePrimary
    : darkModeColors.$surfacePrimary

  const textColor = theme.isDark ? theme.colors.$black : theme.colors.$white

  const chevronRightColor = alpha(textColor, 0.5)

  const renderIcon = useCallback(() => {
    switch (type) {
      case 'pending':
        return <RotatingSyncIcon textColor={textColor} />
      case 'success':
        return (
          <Icons.Custom.CheckSmall
            width={25}
            height={25}
            style={{ marginVertical: -8, marginHorizontal: -5 }}
            color="#1CC51D"
          />
        )
      case 'error':
        return (
          <Icons.Alert.ErrorOutline
            width={19}
            height={19}
            style={{ marginLeft: 0, marginRight: 3 }}
            color={theme.colors.$textDanger}
          />
        )
      default:
        return null
    }
  }, [type, textColor, theme.colors.$textDanger])

  const getMessage = useCallback(() => {
    if (message) {
      return message
    }

    switch (type) {
      case 'pending':
        return 'Transaction pending...'
      case 'success':
        return 'Transaction successful'
      case 'error':
        return 'Transaction failed'
    }
  }, [type, message])

  const renderChevronIcon = useCallback((): JSX.Element => {
    return (
      <View
        style={{
          alignItems: 'flex-end',
          marginLeft: 6,
          marginRight: -11,
          marginVertical: -2
        }}>
        <Icons.Navigation.ChevronRight
          width={20}
          height={20}
          color={chevronRightColor}
        />
      </View>
    )
  }, [chevronRightColor])

  return (
    <TouchableWithoutFeedback
      style={[{ alignSelf: 'flex-start' }, style]}
      testID={testID}
      onPress={onPress}>
      <View
        style={{
          width: SCREEN_WIDTH,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        <View
          style={{
            backgroundColor,
            paddingVertical: 10,
            paddingLeft: 14,
            paddingRight: 18,
            borderRadius: 1000,
            flexDirection: 'row',
            alignItems: 'center'
          }}>
          {renderIcon()}
          <Text
            variant="body1"
            sx={{
              marginLeft: 5,
              fontSize: 14,
              color: textColor
            }}>
            {getMessage()}
          </Text>
          {(type === 'success' || type === 'error') &&
            isActionable &&
            renderChevronIcon()}
        </View>
      </View>
    </TouchableWithoutFeedback>
  )
}

const RotatingSyncIcon = ({
  textColor
}: {
  textColor: string
}): JSX.Element => {
  const rotation = useSharedValue(0)

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(-360, {
        duration: 1500,
        easing: Easing.linear
      }),
      -1,
      false
    )
  }, [rotation])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }]
  }))

  return (
    <Animated.View style={animatedStyle}>
      <Icons.Notification.Sync width={16} height={16} color={textColor} />
    </Animated.View>
  )
}
