import React, {useMemo, useState} from 'react';
import {FlatList, StyleSheet, View} from 'react-native';
import AvaText from 'components/AvaText';
import SearchBar from 'components/SearchBar';
import {NFTItem} from 'screens/nft/NFTItem';
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
    return [...nftRepo.nfts.values()].filter(value => {
      return (
        searchText.length === 0 ||
        value.title.toLowerCase().includes(searchText.toLowerCase())
      );
    });
  }, [nftRepo.nfts, searchText]);

  const updateSearch = (searchVal: string) => {
    setSearchText(searchVal);
  };

  const onItemToggled = (item: NFTItem, isVisible: boolean) => {
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
        keyExtractor={item => item.title}
        ItemSeparatorComponent={() => <View style={{margin: 4}} />}
        renderItem={info => renderItemList(info.item, onItemToggled, theme)}
      />
    </View>
  );
};

const renderItemList = (
  item: NFTItem,
  onItemToggled: (item: NFTItem, isVisible: boolean) => void,
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
        title={item.title}
        subtitle={'test'}
        leftComponent={
          <Avatar.Custom name={item.title} logoUri={item.imageURL} />
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
