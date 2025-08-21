import { Pressable, View } from '@avalabs/k2-alpine'
import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'

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
          paddingLeft: isLeft ? 0 : 8,
          paddingRight: isLeft ? 8 : 0,
          paddingTop: isModal ? 3 : 0,
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'red'
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
    </Pressable>
  )
}

export default NavigationBarButton
