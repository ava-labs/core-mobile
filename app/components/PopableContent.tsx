import React from 'react'
import AvaText from 'components/AvaText'
import { StyleProp, TextStyle, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'

export const PopableContent = ({
  message,
  backgroundColor,
  textStyle
}: {
  message: string
  backgroundColor?: string
  textStyle?: StyleProp<TextStyle>
}) => {
  const { theme } = useApplicationContext()

  return (
    <View
      style={{
        padding: 8,
        backgroundColor: backgroundColor ?? theme.colorBg3,
        borderRadius: 8
      }}>
      <AvaText.Body3 textStyle={textStyle}>{message}</AvaText.Body3>
    </View>
  )
}
