import React, { useMemo, useState } from 'react'
import { FlatList } from 'react-native'
import AvaText from 'components/AvaText'
import SearchBar from 'components/SearchBar'
import ZeroState from 'components/ZeroState'
import AvaListItem from 'components/AvaListItem'
import Avatar from 'components/Avatar'
import Switch from 'components/Switch'
import {
  NFTItemData,
  NFTImageData,
  NFTMetadata,
  selectHiddenNftUIDs,
  setHidden
} from 'store/nft'
import { useDispatch, useSelector } from 'react-redux'
import { useNfts } from 'screens/nft/hooks/useNfts'
import { RefreshControl } from 'components/RefreshControl'
import { View } from '@avalabs/k2-mobile'
import {
  useGetNftImageData,
  useGetNftMetadata
} from 'screens/nft/hooks/useGetNftMetadata'
import { FetchingNextIndicator } from './components/FetchingNextIndicator'

const NftManage = (): JSX.Element => {
  const [searchText, setSearchText] = useState('')
  const dispatch = useDispatch()
  const hiddenNftUIDs = useSelector(selectHiddenNftUIDs)
  const {
    nfts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching
  } = useNfts()
  const { getNftImageData } = useGetNftImageData()
  const { getNftMetadata } = useGetNftMetadata()

  const filteredData = useMemo(() => {
    return nfts.filter(nft => {
      const metadata = getNftMetadata(nft)
      return (
        searchText.length === 0 ||
        nft.tokenId.toLowerCase().includes(searchText.toLowerCase()) ||
        nft.metadata.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        metadata.name?.toLowerCase().includes(searchText.toLowerCase())
      )
    })
  }, [nfts, searchText, getNftMetadata])

  const updateSearch = (searchVal: string): void => {
    setSearchText(searchVal)
  }

  const handleItemHidden = (item: NFTItemData): void => {
    dispatch(setHidden({ tokenUid: item.uid }))
  }

  const onEndReached = ({
    distanceFromEnd
  }: {
    distanceFromEnd: number
  }): void => {
    if (distanceFromEnd > 0 && hasNextPage) fetchNextPage()
  }

  return (
    <View sx={{ paddingHorizontal: 16, flex: 1 }}>
      <AvaText.LargeTitleBold>Manage List</AvaText.LargeTitleBold>
      <SearchBar onTextChanged={updateSearch} searchText={searchText} />
      <FlatList
        data={filteredData}
        ListEmptyComponent={<ZeroState.Collectibles />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.8}
        keyExtractor={item => item.uid}
        ItemSeparatorComponent={Separator}
        renderItem={info =>
          renderItemList({
            item: info.item,
            metadata: getNftMetadata(info.item),
            isHidden: hiddenNftUIDs[info.item.uid] ?? false,
            onHiddenToggle: handleItemHidden,
            imageData: getNftImageData(info.item)
          })
        }
        indicatorStyle="white"
        refreshControl={
          <RefreshControl onRefresh={refetch} refreshing={isRefetching} />
        }
        ListFooterComponent={
          <FetchingNextIndicator isVisible={isFetchingNextPage} />
        }
      />
    </View>
  )
}

const Separator = (): JSX.Element => <View style={{ margin: 4 }} />

const renderItemList = ({
  item,
  metadata,
  isHidden,
  onHiddenToggle,
  imageData
}: {
  item: NFTItemData
  metadata: NFTMetadata
  isHidden: boolean
  onHiddenToggle: (item: NFTItemData) => void
  imageData?: NFTImageData
}): JSX.Element => {
  return (
    <View
      sx={{
        marginVertical: 4,
        borderRadius: 8,
        backgroundColor: '$neutral900'
      }}>
      <AvaListItem.Base
        title={item.tokenId}
        subtitle={metadata.name}
        leftComponent={
          <Avatar.Custom
            name={metadata.name ?? ''}
            logoUri={imageData?.image}
          />
        }
        rightComponent={
          <Switch value={!isHidden} onValueChange={_ => onHiddenToggle(item)} />
        }
      />
    </View>
  )
}

export default NftManage
