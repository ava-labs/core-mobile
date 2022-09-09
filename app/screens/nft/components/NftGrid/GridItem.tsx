import React, { useState } from 'react'
import { Dimensions, Image, View } from 'react-native'
import AvaButton from 'components/AvaButton'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Opacity15 } from 'resources/Constants'
import AvaText from 'components/AvaText'
import { NFTItemData } from 'store/nft'
import { SvgXml } from 'react-native-svg'

const SCREEN_WIDTH = Dimensions.get('window')?.width
const GRID_ITEM_MARGIN = 8
const PARENT_PADDING = 16
const GRID_ITEM_WIDTH =
  (SCREEN_WIDTH - GRID_ITEM_MARGIN * 4 - PARENT_PADDING * 2) / 2

const ErrorFallback = ({ item }: { item: NFTItemData }) => {
  const { theme } = useApplicationContext()

  return (
    <View
      style={{
        backgroundColor: theme.colorPrimary1 + Opacity15,
        padding: 10,
        borderRadius: 8,
        width: GRID_ITEM_WIDTH,
        height: GRID_ITEM_WIDTH,
        justifyContent: 'center'
      }}>
      <AvaText.Heading2 ellipsizeMode={'tail'}>
        #{item.tokenId}
      </AvaText.Heading2>
      <AvaText.Body2 ellipsizeMode={'tail'}>{item.name}</AvaText.Body2>
    </View>
  )
}

export const GridItem = React.memo(
  ({
    item,
    onItemSelected
  }: {
    item: NFTItemData
    onItemSelected: (item: NFTItemData) => void
  }) => {
    const [imgLoadFailed, setImgLoadFailed] = useState(false)

    return (
      <AvaButton.Base
        key={item.uid}
        onPress={() => onItemSelected(item)}
        style={{
          margin: GRID_ITEM_MARGIN
        }}>
        {!item.image || imgLoadFailed ? (
          <ErrorFallback item={item} />
        ) : item.isSvg ? (
          <SvgXml
            xml={item.image}
            width={GRID_ITEM_WIDTH}
            height={GRID_ITEM_WIDTH * (item.aspect ?? 1)}
          />
        ) : (
          <Image
            onError={_ => setImgLoadFailed(true)}
            style={{
              width: GRID_ITEM_WIDTH,
              height: GRID_ITEM_WIDTH * (item.aspect ?? 1),
              borderRadius: 8
            }}
            source={{ uri: item.image }}
          />
        )}
      </AvaButton.Base>
    )
  }
)
