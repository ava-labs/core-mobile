import React, { FC, useMemo } from 'react'
import AvaText from 'components/AvaText'
import { useApplicationContext } from 'contexts/ApplicationContext'
import TokenAddress from 'components/TokenAddress'
import AvaListItem from 'components/AvaListItem'
import Avatar from 'components/Avatar'

interface Props {
  title: string
  address: string
  onPress?: () => void
}

const AddressBookItem: FC<Props> = ({ title, address, onPress }: Props) => {
  const theme = useApplicationContext().theme

  const shortAddress = useMemo(() => {
    return address
  }, [address])

  return (
    <AvaListItem.Base
      title={
        <AvaText.Heading3 ellipsizeMode={'tail'}>{title}</AvaText.Heading3>
      }
      titleAlignment={'flex-start'}
      leftComponent={
        <Avatar.Custom name={title} size={40} circleColor={theme.colorBg3} />
      }
      rightComponent={<TokenAddress address={shortAddress} />}
      rightComponentVerticalAlignment={'center'}
      onPress={onPress}
    />
  )
}

export default AddressBookItem
