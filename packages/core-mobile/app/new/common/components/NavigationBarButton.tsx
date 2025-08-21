import { TouchableOpacity, View } from '@avalabs/k2-alpine'
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
    <TouchableOpacity
      onPress={onPress}
      testID={testID}
      style={[
        {
          paddingLeft: isLeft ? 4 : 8,
          paddingRight: isLeft ? 8 : 4,
          paddingTop: isModal ? 6 : 0,
          height: '100%',
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
