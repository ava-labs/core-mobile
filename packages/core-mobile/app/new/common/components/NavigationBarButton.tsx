import { TouchableOpacity, View } from '@avalabs/k2-alpine'
import { isIOS26 } from 'common/utils/isIOS26'
import React, { useMemo } from 'react'
import {
  Platform,
  StyleProp,
  TouchableOpacityProps,
  ViewStyle
} from 'react-native'

interface NavigationBarButtonProps extends TouchableOpacityProps {
  onPress?: () => void
  children: React.ReactNode
  testID?: string
  isModal?: boolean
  isLeft?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

const NavigationBarButton = React.forwardRef<
  React.ComponentRef<typeof TouchableOpacity>,
  NavigationBarButtonProps
>(
  (
    { onPress, children, isLeft = false, testID, disabled, style, ...props },
    ref
  ): JSX.Element => {
    const containerStyle: ViewStyle = useMemo(() => {
      if (isIOS26) {
        return {
          height: 36,
          width: 36,
          justifyContent: 'center',
          alignItems: 'center'
        }
      }
      return {
        paddingLeft: isLeft ? 4 : 8,
        paddingRight: isLeft ? 8 : 4,
        height: Platform.OS === 'ios' ? '100%' : 56,
        justifyContent: 'center',
        alignItems: 'center'
      }
    }, [isLeft])

    return (
      <TouchableOpacity
        ref={ref}
        // onPress doesn't work for Android when using svgs (only on production)
        onPressOut={onPress}
        testID={testID}
        disabled={disabled}
        style={[containerStyle, style]}
        {...props}>
        <View
          style={{
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: disabled ? 0.4 : 1
          }}>
          {children}
        </View>
      </TouchableOpacity>
    )
  }
)

export default NavigationBarButton
