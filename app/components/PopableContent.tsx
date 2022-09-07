import React from 'react'
import AvaText from 'components/AvaText'
import { View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'

export const PopableContent = ({
  message,
  backgroundColor
}: {
  message: string
  backgroundColor?: string
}) => {
  const { theme } = useApplicationContext()

  return (
    <View
      style={{
        padding: 8,
        backgroundColor: backgroundColor ?? theme.colorBg3,
        borderRadius: 8
      }}>
      <AvaText.Body3>{message}</AvaText.Body3>
    </View>
  )
}
