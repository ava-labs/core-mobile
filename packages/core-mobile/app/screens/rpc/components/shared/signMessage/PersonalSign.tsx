import React, { FC, useContext } from 'react'
import { View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { ApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { toUtf8 } from 'ethereumjs-util'

interface Props {
  message: string
}

const PersonalSign: FC<Props> = ({ message }) => {
  const theme = useContext(ApplicationContext).theme

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <AvaText.Heading3>Message:</AvaText.Heading3>
      <Space y={8} />
      <ScrollView
        style={{
          maxHeight: 250,
          backgroundColor: theme.colorBg3,
          borderRadius: 8,
          padding: 8
        }}>
        <AvaText.Body1>{toUtf8(message)}</AvaText.Body1>
      </ScrollView>
    </View>
  )
}

export default PersonalSign
