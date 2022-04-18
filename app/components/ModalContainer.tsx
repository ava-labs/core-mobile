import React from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface ModalProps {
  containerStyle?: StyleProp<ViewStyle>
  children: any
}

export default function ModalContainer({
  containerStyle,
  children
}: ModalProps) {
  const { theme } = useApplicationContext()

  return (
    <View
      style={{
        height: '100%',
        justifyContent: 'center',
        backgroundColor: theme.overlay
      }}>
      <View
        style={[
          {
            borderRadius: 8,
            backgroundColor: theme.colorBg2,
            padding: 16,
            marginHorizontal: 16,
            marginVertical: 16,
            justifyContent: 'center',
            bottom: 0
          },
          containerStyle
        ]}>
        {children}
      </View>
    </View>
  )
}
