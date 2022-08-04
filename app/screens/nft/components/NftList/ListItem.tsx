import React from 'react'
import { View } from 'react-native'
import AvaListItem from 'components/AvaListItem'
import { Opacity85 } from 'resources/Constants'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Avatar from 'components/Avatar'
import AvaText from 'components/AvaText'
import { NFTItemData } from 'store/nft'

type Props = {
  item: NFTItemData
  onItemSelected: (item: NFTItemData) => void
}

export const ListItem = ({ item, onItemSelected }: Props) => {
  const { theme } = useApplicationContext()

  return (
    <View
      style={{
        marginVertical: 4,
        borderRadius: 8,
        backgroundColor: theme.colorBg2 + Opacity85
      }}>
      <AvaListItem.Base
        onPress={() => onItemSelected(item)}
        titleAlignment={'flex-start'}
        title={
          <AvaText.Heading2 ellipsizeMode={'tail'}>
            #{item.tokenId}
          </AvaText.Heading2>
        }
        subtitle={
          <AvaText.Body2 ellipsizeMode={'tail'}>{item.name}</AvaText.Body2>
        }
        leftComponent={
          <Avatar.Custom size={40} name={item.name} logoUri={item.image} />
        }
      />
    </View>
  )
}
