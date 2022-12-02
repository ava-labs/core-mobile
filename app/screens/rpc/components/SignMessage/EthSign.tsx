import React, { FC, useContext } from 'react'
import { View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { ApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { MessageAction } from './types'

interface Props {
  action: MessageAction
}

const EthSign: FC<Props> = ({ action }) => {
  const theme = useContext(ApplicationContext).theme

  return (
    <View style={{ flex: 1 }}>
      <AvaText.Body2 color={theme.colorPrimary1}>
        Signing this message can be dangerous. This signature could potentially
        perform any operation on your account&apos;s behalf, including granting
        complete control of your account and all of its assets to the requesting
        site. Only sign this message if you know what you&apos;re doing or
        completely trust the requesting site
      </AvaText.Body2>
      <Space y={8} />
      <AvaText.Body2>Message:</AvaText.Body2>
      <Space y={8} />
      <ScrollView
        style={{
          maxHeight: 250,
          backgroundColor: theme.colorBg3,
          borderRadius: 8,
          padding: 8
        }}>
        <AvaText.Body1>{action.displayData}</AvaText.Body1>
      </ScrollView>
    </View>
  )
}

export default EthSign
