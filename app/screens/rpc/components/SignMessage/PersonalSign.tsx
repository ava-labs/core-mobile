import React, { FC, useContext } from 'react'
import { View } from 'react-native'
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
    <View>
      <Space y={16} />
      <AvaText.Body2>Message:</AvaText.Body2>
      <Space y={8} />
      <View style={{ backgroundColor: theme.colorBg3, padding: 16 }}>
        <AvaText.Body1>{toUtf8(action.displayData)}</AvaText.Body1>
      </View>
    </View>
  )
}

export default PersonalSign
