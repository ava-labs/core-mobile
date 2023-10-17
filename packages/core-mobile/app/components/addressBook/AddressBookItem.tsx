import React, { FC } from 'react'
import AvaText from 'components/AvaText'
import { useApplicationContext } from 'contexts/ApplicationContext'
import TokenAddress from 'components/TokenAddress'
import AvaListItem from 'components/AvaListItem'
import Avatar from 'components/Avatar'
import { View } from 'react-native'
import { Space } from 'components/Space'

interface Props {
  title: string
  address?: string
  addressBtc?: string
  onPress?: () => void
}

const AddressBookItem: FC<Props> = ({
  title,
  address,
  addressBtc,
  onPress
}: Props) => {
  const theme = useApplicationContext().theme

  return (
    <AvaListItem.Base
      title={
        <AvaText.Heading3 ellipsizeMode={'tail'}>{title}</AvaText.Heading3>
      }
      titleAlignment={'flex-start'}
      leftComponent={
        <Avatar.Custom name={title} size={40} circleColor={theme.colorBg3} />
      }
      rightComponent={
        <View>
          {!!address && <TokenAddress address={address} showIcon />}
          {!!address && !!addressBtc && <Space y={8} />}
          {!!addressBtc && <TokenAddress address={addressBtc} showIcon />}
        </View>
      }
      rightComponentVerticalAlignment={'center'}
      onPress={onPress}
    />
  )
}

export default AddressBookItem
