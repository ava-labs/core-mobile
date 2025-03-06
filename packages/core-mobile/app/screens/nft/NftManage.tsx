import React, { useMemo, useState } from 'react'
import { FlatList } from 'react-native'
import AvaText from 'components/AvaText'
import SearchBar from 'components/SearchBar'
import ZeroState from 'components/ZeroState'
import AvaListItem from 'components/AvaListItem'
import Avatar from 'components/Avatar'
import Switch from 'components/Switch'
import { selectHiddenNftLocalIds, setHidden } from 'store/nft'
import { useDispatch, useSelector } from 'react-redux'
import { RefreshControl } from 'components/RefreshControl'
import { View } from '@avalabs/k2-mobile'
import { useNftItemsContext } from 'contexts/NftItemsContext'
import { getNftImage, getNftTitle } from 'services/nft/utils'
import { NftItem } from 'services/nft/types'

const NftManage = (): JSX.Element => {
  const [searchText, setSearchText] = useState('')
  const dispatch = useDispatch()
  const hiddenNftUIDs = useSelector(selectHiddenNftLocalIds)
  const { nftItems: nfts, refetchNfts, isNftsRefetching } = useNftItemsContext()
  const filteredData = useMemo(() => {
    const keyword = searchText.toLowerCase()

    return nfts.filter(nft => {
      return (
        searchText.length === 0 ||
        nft.tokenId.toLowerCase().includes(keyword) ||
        nft.name.toLowerCase().includes(keyword) ||
        nft.processedMetadata?.name?.toLowerCase().includes(keyword)
      )
    })
  }, [nfts, searchText])

  const updateSearch = (searchVal: string): void => {
    setSearchText(searchVal)
  }

  const handleItemHidden = (item: NftItem): void => {
    dispatch(setHidden({ localId: item.localId }))
  }

  return (
    <View sx={{ paddingHorizontal: 16, flex: 1 }}>
      <AvaText.LargeTitleBold>Manage List</AvaText.LargeTitleBold>
      <SearchBar onTextChanged={updateSearch} searchText={searchText} />
      <FlatList
        data={filteredData}
        ListEmptyComponent={<ZeroState.Collectibles />}
        onEndReachedThreshold={0.8}
        keyExtractor={item => item.localId}
        ItemSeparatorComponent={Separator}
        renderItem={info =>
          renderItemList({
            item: info.item,
            isHidden: hiddenNftUIDs[info.item.localId] ?? false,
            onHiddenToggle: handleItemHidden
          })
        }
        indicatorStyle="white"
        refreshControl={
          <RefreshControl
            onRefresh={refetchNfts}
            refreshing={isNftsRefetching}
          />
        }
      />
    </View>
  )
}

const Separator = (): JSX.Element => <View style={{ margin: 4 }} />

const renderItemList = ({
  item,
  isHidden,
  onHiddenToggle
}: {
  item: NftItem
  isHidden: boolean
  onHiddenToggle: (item: NftItem) => void
}): JSX.Element => {
  const name = getNftTitle(item)
  const imageUrl = getNftImage(item)

  return (
    <View
      sx={{
        marginVertical: 4,
        borderRadius: 8,
        backgroundColor: '$neutral900'
      }}>
      <AvaListItem.Base
        title={`#${item.tokenId}`}
        subtitle={name}
        leftComponent={<Avatar.Custom name={name} logoUri={imageUrl} />}
        rightComponent={
          <Switch
            testID={
              isHidden
                ? `${item.tokenId}_blocked_nft`
                : `${item.tokenId}_displayed_nft`
            }
            value={!isHidden}
            onValueChange={_ => onHiddenToggle(item)}
          />
        }
      />
    </View>
  )
}

export default NftManage
