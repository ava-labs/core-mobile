import React, { useMemo, useState } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import SearchBar from 'components/SearchBar'
import ZeroState from 'components/ZeroState'
import { COLORS_DAY, COLORS_NIGHT, Opacity85 } from 'resources/Constants'
import AvaListItem from 'components/AvaListItem'
import Avatar from 'components/Avatar'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Switch from 'components/Switch'
import { NFTItemData, selectHiddenNftUIDs, setHidden } from 'store/nft'
import { useDispatch, useSelector } from 'react-redux'
import { useGetNfts } from 'store/nft/hooks'
import { RefreshControl } from 'components/RefreshControl'
import { FetchingNextIndicator } from './components/FetchingNextIndicator'

const NftManage = () => {
  const { theme } = useApplicationContext()
  const [searchText, setSearchText] = useState('')
  const dispatch = useDispatch()
  const hiddenNftUIDs = useSelector(selectHiddenNftUIDs)
  const { nfts, fetchNext, isFetchingNext, refresh, isRefreshing } =
    useGetNfts()

  const filteredData = useMemo(() => {
    return nfts.filter(nft => {
      return (
        searchText.length === 0 ||
        nft.tokenId.toLowerCase().includes(searchText.toLowerCase()) ||
        nft.metadata.name?.toLowerCase().includes(searchText.toLowerCase())
      )
    })
  }, [nfts, searchText])

  const updateSearch = (searchVal: string) => {
    setSearchText(searchVal)
  }

  const onItemToggled = (item: NFTItemData) => {
    dispatch(setHidden({ tokenUid: item.uid }))
  }

  const onEndReached = ({ distanceFromEnd }: { distanceFromEnd: number }) => {
    if (distanceFromEnd > 0) fetchNext()
  }

  return (
    <View style={styles.container}>
      <AvaText.LargeTitleBold>Manage List</AvaText.LargeTitleBold>
      <SearchBar onTextChanged={updateSearch} searchText={searchText} />
      <FlatList
        style={styles.list}
        data={filteredData}
        ListEmptyComponent={<ZeroState.Collectibles />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.8}
        keyExtractor={item => item.uid}
        ItemSeparatorComponent={Separator}
        renderItem={info =>
          renderItemList(
            info.item,
            hiddenNftUIDs[info.item.uid] ?? false,
            onItemToggled,
            theme
          )
        }
        indicatorStyle="white"
        refreshControl={
          <RefreshControl onRefresh={refresh} refreshing={isRefreshing} />
        }
        ListFooterComponent={
          <FetchingNextIndicator isVisible={isFetchingNext} />
        }
      />
    </View>
  )
}

const Separator = () => <View style={{ margin: 4 }} />

const renderItemList = (
  item: NFTItemData,
  isHidden: boolean,
  onItemToggled: (item: NFTItemData) => void,
  theme: typeof COLORS_DAY | typeof COLORS_NIGHT
) => {
  return (
    <View
      style={{
        marginVertical: 4,
        borderRadius: 8,
        backgroundColor: theme.colorBg2 + Opacity85
      }}>
      <AvaListItem.Base
        title={item.tokenId}
        subtitle={item.metadata.name}
        leftComponent={
          <Avatar.Custom
            name={item.metadata.name ?? ''}
            logoUri={item.metadata.imageUri}
          />
        }
        rightComponent={
          <Switch value={!isHidden} onValueChange={_ => onItemToggled(item)} />
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    flex: 1
  },
  list: {
    flex: 1
  }
})

export default NftManage
