import React from 'react'
import AvaListItem from 'components/AvaListItem'
import AvaText from 'components/AvaText'
import DeviceInfo from 'react-native-device-info'

export default function VersionItem() {
  const version = DeviceInfo.getReadableVersion()
  return (
    <AvaListItem.Base
      disabled
      title={'Version'}
      titleAlignment={'flex-start'}
      leftComponent={null}
      rightComponent={<AvaText.Body2>{version}</AvaText.Body2>}
      rightComponentVerticalAlignment={'center'}
    />
  )
}
