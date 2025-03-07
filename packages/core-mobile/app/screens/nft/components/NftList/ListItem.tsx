import React from 'react'
import { View } from 'react-native'
import AvaListItem from 'components/AvaListItem'
import { Opacity85 } from 'resources/Constants'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Avatar from 'components/Avatar'
import AvaText from 'components/AvaText'
import { getNftImage, getNftTitle, isErc1155 } from 'services/nft/utils'
import { NftItem } from 'services/nft/types'

type Props = {
  item: NftItem
  onItemSelected: (item: NftItem) => void
  testID?: string
}

export const ListItem = ({
  item,
  onItemSelected,
  testID
}: Props): JSX.Element => {
  const { theme } = useApplicationContext()
  const imageUri = getNftImage(item)
  const name = getNftTitle(item)

  return (
    <View
      testID={testID}
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
        subtitle={<AvaText.Body2 ellipsizeMode={'tail'}>{name}</AvaText.Body2>}
        leftComponent={<Avatar.Custom size={40} name={''} logoUri={imageUri} />}
        rightComponentVerticalAlignment={'center'}
        rightComponent={
          isErc1155(item) ? (
            <AvaText.Heading3 ellipsizeMode={'tail'}>
              {item.balance.toString()}
            </AvaText.Heading3>
          ) : null
        }
      />
    </View>
  )
}
