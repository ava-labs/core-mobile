import React, { FC, useContext } from 'react'
import { TextInput, View } from 'react-native'
import { ApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { Action } from 'navigation/messages/models'
import {toUtf8} from 'ethereumjs-util';

interface Props {
  action: Action
}

const PersonalSign: FC<Props> = ({ action }) => {
  const theme = useContext(ApplicationContext).theme

  return (
    <View>
      <Space y={16} />
      <AvaText.Body2>Message:</AvaText.Body2>
      <View style={{ backgroundColor: theme.colorBg2 }}>
        <TextInput
          style={{ flexGrow: 0.2 }}
          disableFullscreenUI
          editable={false}
          value={toUtf8(action.displayData.data)}
          scrollEnabled
          multiline
        />
      </View>
    </View>
  )
}

export default PersonalSign
