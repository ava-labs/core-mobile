import { TouchableOpacity, View } from '@avalabs/k2-alpine'
import React from 'react'
import { Platform, StyleProp, ViewStyle } from 'react-native'

const NavigationBarButton = ({
  onPress,
  children,
  isLeft = false,
  testID,
  style
}: {
  onPress?: () => void
  children: React.ReactNode
  testID?: string
  isModal?: boolean
  isLeft?: boolean
  style?: StyleProp<ViewStyle>
}): JSX.Element => {
  return (
    <TouchableOpacity
      // onPress doesn't work for Android when using svgs (only on production)
      onPressOut={onPress}
      testID={testID}
      style={[
        {
          paddingLeft: isLeft ? 4 : 8,
          paddingRight: isLeft ? 8 : 4,
          height: Platform.OS === 'ios' ? '100%' : 56,
          justifyContent: 'center',
          alignItems: 'center'
        },
        style
      ]}>
      <View
        style={{
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        {children}
      </View>
    </TouchableOpacity>
  )
}

export default NavigationBarButton
