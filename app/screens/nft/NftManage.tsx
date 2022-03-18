import React, {useMemo, useState} from 'react';
import {FlatList, StyleSheet, View} from 'react-native';
import AvaText from 'components/AvaText';
import SearchBar from 'components/SearchBar';
import {NFTItemData} from 'screens/nft/NftCollection';
import ZeroState from 'components/ZeroState';
import {COLORS_DAY, COLORS_NIGHT} from 'resources/Constants';
import AvaListItem from 'components/AvaListItem';
import Avatar from 'components/Avatar';
import {useApplicationContext} from 'contexts/ApplicationContext';
import Switch from 'components/Switch';

export type NftManageProps = {};
const NftManage = () => {
  const {theme} = useApplicationContext();
  const {nftRepo} = useApplicationContext().repo;
  const [searchText, setSearchText] = useState('');

  const filteredData = useMemo(() => {
    return [...nftRepo.nfts.values()].filter(nft => {
      return (
        searchText.length === 0 ||
        nft.token_id.toLowerCase().includes(searchText.toLowerCase()) ||
        nft.collection.contract_name
          .toLowerCase()
          .includes(searchText.toLowerCase())
      );
    });
  }, [nftRepo.nfts, searchText]);

  const updateSearch = (searchVal: string) => {
    setSearchText(searchVal);
  };

  const onItemToggled = (item: NFTItemData, isVisible: boolean) => {
    item.isShowing = isVisible;
    nftRepo.saveNfts(nftRepo.nfts);
  };

  return (
    <View style={styles.container}>
      <AvaText.LargeTitleBold>Manage List</AvaText.LargeTitleBold>
      <SearchBar onTextChanged={updateSearch} searchText={searchText} />
      <FlatList
        style={{flex: 1}}
        data={filteredData}
        ListEmptyComponent={<ZeroState.Collectibles />}
        keyExtractor={item => item.uid}
        ItemSeparatorComponent={() => <View style={{margin: 4}} />}
        renderItem={info => renderItemList(info.item, onItemToggled, theme)}
      />
    </View>
  );
};

const renderItemList = (
  item: NFTItemData,
  onItemToggled: (item: NFTItemData, isVisible: boolean) => void,
  theme: typeof COLORS_DAY | typeof COLORS_NIGHT,
) => {
  return (
    <View
      style={{
        marginVertical: 4,
        borderRadius: 8,
        backgroundColor: theme.listItemBg + 'D9',
      }}>
      <AvaListItem.Base
        title={item.token_id}
        subtitle={item.collection.contract_name}
        leftComponent={
          <Avatar.Custom
            name={item.collection.contract_name}
            logoUri={item.external_data.image_256}
          />
        }
        rightComponent={
          <Switch
            value={item.isShowing}
            onValueChange={value => onItemToggled(item, value)}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    flex: 1,
  },
});

export default NftManage;
