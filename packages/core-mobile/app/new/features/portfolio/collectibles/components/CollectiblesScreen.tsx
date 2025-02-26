import {
  alpha,
  AnimatedPressable,
  Icons,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ListRenderItem } from '@shopify/flash-list'
import { Image } from 'expo-image'
import React, { ReactNode } from 'react'
import { Platform, ScaledSize, ViewStyle } from 'react-native'
import { MasonryFlashList } from 'react-native-collapsible-tab-view'
import { NFTItem } from 'store/nft'

const HORIZONTAL_MARGIN = 16
const HORIZONTAL_ITEM_GAP = 14
const VERTICAL_ITEM_GAP = 12
const LIST_CARD_HEIGHT = 100

export const getGridCardHeight = (
  type: 'grid' | 'list' | 'columns',
  dimensions: ScaledSize
): number => {
  switch (type) {
    case 'list':
      return LIST_CARD_HEIGHT
    case 'grid':
      return (
        (dimensions.width - HORIZONTAL_MARGIN - HORIZONTAL_ITEM_GAP * 3.6) / 2
      )
    default:
      return (dimensions.width - HORIZONTAL_MARGIN - HORIZONTAL_ITEM_GAP) / 1.5
  }
}

// function useCollectibles(): {
//   data: NFTItem[]
//   filter: string
//   sort: string
// } {
//   return {
//     data: [],
//     filter: '',
//     sort: ''
//   }
// }

export const CollectiblesScreen = (): JSX.Element => {
  const data: NFTItem[] = []

  // const { data, filter, sort } = useCollectibles()

  const renderItem: ListRenderItem<NFTItem> = ({ item, index }) => {
    return (
      <View>
        <NftCard nft={item} index={index} type="grid" />
      </View>
    )
  }

  const renderEmpty = (): JSX.Element => {
    return <EmptyCollectibles />
  }

  return (
    <MasonryFlashList
      renderItem={renderItem}
      data={data}
      numColumns={2}
      estimatedItemSize={150}
      showsVerticalScrollIndicator={false}
      overScrollMode="never"
      scrollEnabled={data?.length > 0}
      removeClippedSubviews={Platform.OS === 'android'}
      ListEmptyComponent={renderEmpty}
      style={{
        overflow: 'visible',
        marginTop: HORIZONTAL_MARGIN
      }}
      contentContainerStyle={{
        padding: data?.length ? HORIZONTAL_MARGIN - HORIZONTAL_ITEM_GAP / 2 : 0,
        paddingTop: HORIZONTAL_ITEM_GAP,
        paddingBottom: HORIZONTAL_MARGIN
      }}
    />
  )
}

const NftCard = ({
  nft,
  type,
  index
}: {
  nft: NFTItem
  type: 'grid' | 'list'
  index: number
}): JSX.Element => {
  return (
    <AnimatedPressable>
      <CardContainer
        style={{
          height: index % 3 === 0 ? 220 : 180,
          marginHorizontal: type === 'grid' ? HORIZONTAL_ITEM_GAP / 2 : 0,
          marginVertical: type === 'grid' ? VERTICAL_ITEM_GAP / 2 : 0
        }}>
        <Text>{nft.metadata?.imageUri}</Text>
        <ContentRenderer
          imageUrl={nft.imageData?.image}
          height={index % 3 === 0 ? 220 : 180}
        />
      </CardContainer>
    </AnimatedPressable>
  )
}

const ContentRenderer = ({
  style,
  width = 200,
  height,
  imageUrl
}: {
  style?: ViewStyle
  width?: number
  height: number
  imageUrl?: string
}): JSX.Element => {
  return (
    <View
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        ...style
      }}>
      <Image
        style={{
          flex: 1,
          width: '100%',
          borderRadius: 18
        }}
        source={imageUrl ?? `https://picsum.photos/${width}/${height}`}
        contentFit="cover"
      />
    </View>
  )
}

const EmptyCollectibles = (): JSX.Element => {
  return (
    <View
      sx={{
        flex: 1,
        flexDirection: 'row',
        gap: HORIZONTAL_MARGIN,
        padding: HORIZONTAL_MARGIN
      }}>
      <View
        style={{
          flex: 1,
          gap: VERTICAL_ITEM_GAP
        }}>
        <AnimatedPressable>
          <CardContainer
            style={{
              height: 220
            }}>
            <Icons.Custom.Search color={'#000000'} />
          </CardContainer>
        </AnimatedPressable>

        <CardContainer
          style={{
            height: 180
          }}
        />
      </View>
      <View
        style={{
          flex: 1,
          gap: VERTICAL_ITEM_GAP
        }}>
        <CardContainer
          style={{
            height: 190
          }}
        />
        <CardContainer
          style={{
            height: 190
          }}
        />
      </View>
    </View>
  )
}

const CardContainer = ({
  style,
  children
}: {
  style: ViewStyle
  children?: ReactNode
}): JSX.Element => {
  const {
    theme: { isDark }
  } = useTheme()
  return (
    <View
      style={{
        height: 220,
        backgroundColor: alpha(isDark ? '#3F3F42' : '#F6F6F6', 0.8),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: alpha(isDark ? '#fff' : '#000', 0.1),
        borderRadius: 18,
        ...style
      }}>
      {children}
    </View>
  )
}
