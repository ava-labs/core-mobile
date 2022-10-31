import React, { FC, useContext } from 'react'
import { ScrollView, View } from 'react-native'
import { ApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { MessageAction } from 'services/walletconnect/types'
import { toUtf8 } from 'ethereumjs-util'

interface Props {
  action: MessageAction
}

const PersonalSign: FC<Props> = ({ action }) => {
  const theme = useContext(ApplicationContext).theme

  return (
    <View style={{ flex: 1 }}>
      <Space y={16} />
      <AvaText.Body2>Message:</AvaText.Body2>
      <Space y={8} />
      <ScrollView
        style={{
          maxHeight: 250,
          backgroundColor: theme.colorBg3,
          borderRadius: 8,
          padding: 8
        }}>
        <AvaText.Body1>{toUtf8(action.displayData)}</AvaText.Body1>
      </ScrollView>
    </View>
  )
}

export default PersonalSign
