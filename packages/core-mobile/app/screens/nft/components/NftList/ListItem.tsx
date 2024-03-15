import React from 'react'
import { View } from 'react-native'
import AvaListItem from 'components/AvaListItem'
import { Opacity85 } from 'resources/Constants'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Avatar from 'components/Avatar'
import AvaText from 'components/AvaText'
import { NFTItem } from 'store/nft'
import { isErc1155 } from 'services/nft/utils'

type Props = {
  item: NFTItem
  onItemSelected: (item: NFTItem) => void
}

export const ListItem = ({ item, onItemSelected }: Props): JSX.Element => {
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
            {`#${item.tokenId} `}
          </AvaText.Heading2>
        }
        subtitle={
          <AvaText.Body2 ellipsizeMode={'tail'}>
            {item.processedMetadata.name}
          </AvaText.Body2>
        }
        leftComponent={
          <Avatar.Custom
            size={40}
            name={item.processedMetadata.name ?? ''}
            logoUri={item.imageData?.image}
          />
        }
        rightComponentVerticalAlignment={'center'}
        rightComponent={
          isErc1155(item) ? (
            <AvaText.Heading3 ellipsizeMode={'tail'}>
              {item.balance}
            </AvaText.Heading3>
          ) : null
        }
      />
    </View>
  )
}
