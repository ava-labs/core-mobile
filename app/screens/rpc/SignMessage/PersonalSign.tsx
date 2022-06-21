import React, { FC, useContext } from 'react'
import { View } from 'react-native'
import { ApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { Action } from 'navigation/messages/models'
import { toUtf8 } from 'ethereumjs-util'

interface Props {
  action: Action
}

const PersonalSign: FC<Props> = ({ action }) => {
  const theme = useContext(ApplicationContext).theme

  return (
    <View>
      <Space y={16} />
      <AvaText.Body2>Message:</AvaText.Body2>
      <Space y={8} />
      <View style={{ backgroundColor: theme.colorBg3, padding: 16 }}>
        <AvaText.Body1>{toUtf8(action.displayData.data)}</AvaText.Body1>
      </View>
    </View>
  )
}

export default PersonalSign
