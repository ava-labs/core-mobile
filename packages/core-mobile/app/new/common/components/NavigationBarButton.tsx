import { Pressable, View } from '@avalabs/k2-alpine'
import React from 'react'
import { Platform, StyleProp, ViewStyle } from 'react-native'

const NavigationBarButton = ({
  onPress,
  children,
  isModal = false,
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
    <Pressable
      onPress={onPress}
      testID={testID}
      style={[
        {
          marginLeft: isLeft ? (Platform.OS === 'ios' ? 0 : -12) : 0,
          marginTop: -6,
          paddingLeft: 16,
          paddingRight: 16,
          paddingVertical: 16,
          justifyContent: 'center'
        },
        style
      ]}>
      <View
        style={
          isModal
            ? {
                marginTop: 10,
                marginBottom: -10
              }
            : undefined
        }>
        {children}
      </View>
    </Pressable>
  )
}

export default NavigationBarButton
