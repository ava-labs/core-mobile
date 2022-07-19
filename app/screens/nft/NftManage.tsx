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
import { NFTItemData, saveNFT, selectNftCollection } from 'store/nft'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import { selectActiveAccount } from 'store/account'

const NftManage = () => {
  const { theme } = useApplicationContext()
  const [searchText, setSearchText] = useState('')
  const dispatch = useDispatch()
  const network = useSelector(selectActiveNetwork)
  const account = useSelector(selectActiveAccount)
  const nfts = useSelector(selectNftCollection)

  const filteredData = useMemo(() => {
    return nfts.filter(nft => {
      return (
        searchText.length === 0 ||
        nft.tokenId.toLowerCase().includes(searchText.toLowerCase()) ||
        nft.name.toLowerCase().includes(searchText.toLowerCase())
      )
    })
  }, [nfts, searchText])

  const updateSearch = (searchVal: string) => {
    setSearchText(searchVal)
  }

  const onItemToggled = (item: NFTItemData) => {
    dispatch(
      saveNFT({
        chainId: network.chainId,
        address: account!.address,
        token: {
          ...item,
          isShowing: !item.isShowing
        }
      })
    )
  }

  return (
    <View style={styles.container}>
      <AvaText.LargeTitleBold>Manage List</AvaText.LargeTitleBold>
      <SearchBar onTextChanged={updateSearch} searchText={searchText} />
      <FlatList
        style={{ flex: 1 }}
        data={filteredData}
        ListEmptyComponent={<ZeroState.Collectibles />}
        keyExtractor={item => item.uid}
        ItemSeparatorComponent={() => <View style={{ margin: 4 }} />}
        renderItem={info => renderItemList(info.item, onItemToggled, theme)}
      />
    </View>
  )
}

const renderItemList = (
  item: NFTItemData,
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
        subtitle={item.name}
        leftComponent={<Avatar.Custom name={item.name} logoUri={item.image} />}
        rightComponent={
          <Switch
            value={item.isShowing}
            onValueChange={_ => onItemToggled(item)}
          />
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
