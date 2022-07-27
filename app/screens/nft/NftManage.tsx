import React, { useEffect, useMemo, useState } from 'react'
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
import { ActivityIndicator } from 'components/ActivityIndicator'
import { appendLoader, LOADER_UID } from 'screens/nft/tools'

const NftManage = () => {
  const { theme } = useApplicationContext()
  const [searchText, setSearchText] = useState('')
  const dispatch = useDispatch()
  const hiddenNftUIDs = useSelector(selectHiddenNftUIDs)
  const { nfts, fetchNext, isFetching, hasMore } = useGetNfts()
  const [listEndReached, setListEndReached] = useState(false)

  const filteredData = useMemo(() => {
    const filtered = nfts.filter(nft => {
      return (
        searchText.length === 0 ||
        nft.tokenId.toLowerCase().includes(searchText.toLowerCase()) ||
        nft.name.toLowerCase().includes(searchText.toLowerCase())
      )
    })
    if (searchText.length !== 0) {
      if (filtered.length === 0 && hasMore) {
        //load until we find the searched result or !hasMore
        setListEndReached(true)
        return appendLoader(filtered)
      } else {
        return filtered
      }
    } else {
      return hasMore ? appendLoader(filtered) : filtered
    }
  }, [hasMore, nfts, searchText])

  useEffect(onListEndReachedFx, [fetchNext, isFetching, listEndReached])

  function onListEndReachedFx() {
    if (listEndReached && !isFetching) {
      fetchNext()
    } else if (listEndReached && isFetching) {
      setListEndReached(false)
    }
  }

  const updateSearch = (searchVal: string) => {
    setSearchText(searchVal)
  }

  const onItemToggled = (item: NFTItemData) => {
    const isHidden = !hiddenNftUIDs[item.uid]
    dispatch(setHidden({ isHidden, tokenUid: item.uid }))
  }

  return (
    <View style={styles.container}>
      <AvaText.LargeTitleBold>Manage List</AvaText.LargeTitleBold>
      <SearchBar onTextChanged={updateSearch} searchText={searchText} />
      <FlatList
        style={{ flex: 1 }}
        data={filteredData}
        ListEmptyComponent={<ZeroState.Collectibles />}
        onEndReached={() => setListEndReached(true)}
        onEndReachedThreshold={0.01}
        keyExtractor={item => item.uid}
        ItemSeparatorComponent={() => <View style={{ margin: 4 }} />}
        renderItem={info =>
          renderItemList(
            info.item,
            hiddenNftUIDs[info.item.uid],
            onItemToggled,
            theme
          )
        }
      />
    </View>
  )
}

const renderItemList = (
  item: NFTItemData,
  isHidden: boolean,
  onItemToggled: (item: NFTItemData) => void,
  theme: typeof COLORS_DAY | typeof COLORS_NIGHT
) => {
  return item.uid === LOADER_UID ? (
    <ActivityIndicator size={40} style={{ padding: 40 }} />
  ) : (
    <View
      style={{
        marginVertical: 4,
        borderRadius: 8,
        backgroundColor: theme.colorBg2 + Opacity85
      }}>
      <AvaListItem.Base
        title={item.tokenId}
        subtitle={item.name}
        leftComponent={<Avatar.Custom name={item.name} logoUri={item.image} />}
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
  }
})

export default NftManage
