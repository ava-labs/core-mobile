import React, { useMemo, useState } from 'react'
import { FlatList } from 'react-native'
import AvaText from 'components/AvaText'
import SearchBar from 'components/SearchBar'
import ZeroState from 'components/ZeroState'
import AvaListItem from 'components/AvaListItem'
import Avatar from 'components/Avatar'
import Switch from 'components/Switch'
import { selectHiddenNftUIDs, setHidden, NFTItem } from 'store/nft'
import { useDispatch, useSelector } from 'react-redux'
import { View } from '@avalabs/k2-mobile'
import { useNftItemsContext } from 'contexts/NFTItemsContext'

const NftManage = (): JSX.Element => {
  const [searchText, setSearchText] = useState('')
  const dispatch = useDispatch()
  const hiddenNftUIDs = useSelector(selectHiddenNftUIDs)
  const { nftItems: nfts } = useNftItemsContext()
  const filteredData = useMemo(() => {
    const keyword = searchText.toLowerCase()

    return nfts.filter(nft => {
      return (
        searchText.length === 0 ||
        nft.tokenId.toLowerCase().includes(keyword) ||
        nft.metadata.name?.toLowerCase().includes(keyword) ||
        nft.processedMetadata.name?.toLowerCase().includes(keyword)
      )
    })
  }, [nfts, searchText])

  const updateSearch = (searchVal: string): void => {
    setSearchText(searchVal)
  }

  const handleItemHidden = (item: NFTItem): void => {
    dispatch(setHidden({ tokenUid: item.uid }))
  }

  return (
    <View sx={{ paddingHorizontal: 16, flex: 1 }}>
      <AvaText.LargeTitleBold>Manage List</AvaText.LargeTitleBold>
      <SearchBar onTextChanged={updateSearch} searchText={searchText} />
      <FlatList
        data={filteredData}
        ListEmptyComponent={<ZeroState.Collectibles />}
        keyExtractor={item => item.uid}
        ItemSeparatorComponent={Separator}
        renderItem={info =>
          renderItemList({
            item: info.item,
            isHidden: hiddenNftUIDs[info.item.uid] ?? false,
            onHiddenToggle: handleItemHidden
          })
        }
        indicatorStyle="white"
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
  item: NFTItem
  isHidden: boolean
  onHiddenToggle: (item: NFTItem) => void
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
        subtitle={item.processedMetadata.name}
        leftComponent={
          <Avatar.Custom
            name={item.processedMetadata.name ?? ''}
            logoUri={item.imageData?.image}
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
