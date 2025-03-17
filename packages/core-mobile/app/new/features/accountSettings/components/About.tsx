import React from 'react'
import { GroupList } from '@avalabs/k2-alpine'
import DeviceInfo from 'react-native-device-info'

export const About = ({
  selectSendFeedback,
  selectLegal,
  selectHelpCenter
}: {
  selectSendFeedback: () => void
  selectLegal: () => void
  selectHelpCenter: () => void
}): React.JSX.Element => {
  const version = DeviceInfo.getReadableVersion()

  const data = [
    {
      title: 'Send feedback',
      onPress: selectSendFeedback
    },
    {
      title: 'Legal',
      onPress: selectLegal
    },
    {
      title: 'Help center',
      onPress: selectHelpCenter
    },
    {
      title: 'App version',
      value: version
    }
  ]

  return (
    <GroupList
      data={data}
      titleSx={{ fontSize: 16, lineHeight: 22, fontFamily: 'Inter-Regular' }}
      separatorMarginRight={16}
    />
  )
}
