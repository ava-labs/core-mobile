import React, { FC, useContext } from 'react'
import { TextInput, View } from 'react-native'
import { ApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { Action } from 'navigation/messages/models'

interface Props {
  action: Action
}

const EthSign: FC<Props> = ({ action }) => {
  const theme = useContext(ApplicationContext).theme

  return (
    <>
      <AvaText.Body2 color={theme.colorPrimary1}>
        Signing this message can be dangerous. This signature could potentially
        perform any operation on your account&apos;s behalf, including granting
        complete control of your account and all of its assets to the requesting
        site. Only sign this message if you know what you&apos;re doing or
        completely trust the requesting site
      </AvaText.Body2>
      <Space y={16} />
      <AvaText.Body2>Message:</AvaText.Body2>
      <View style={{ backgroundColor: theme.colorBg2 }}>
        <TextInput
          style={{ flexGrow: 0.2 }}
          disableFullscreenUI
          editable={false}
          value={action.displayData.data}
          scrollEnabled
        />
      </View>
    </>
  )
}

export default EthSign
