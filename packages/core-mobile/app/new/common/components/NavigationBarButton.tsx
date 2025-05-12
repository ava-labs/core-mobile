import { Pressable, View } from '@avalabs/k2-alpine'
import React from 'react'
import { Platform } from 'react-native'

const NavigationBarButton = ({
  onPress,
  children,
  isModal = false,
  testID
}: {
  onPress?: () => void
  children: React.ReactNode
  testID?: string
  isModal?: boolean
}): JSX.Element => {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      sx={{
        paddingLeft: Platform.OS === 'ios' ? 16 : 6,
        paddingRight: 16,
        paddingVertical: 16,
        height: '100%',
        justifyContent: 'flex-end'
      }}>
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
