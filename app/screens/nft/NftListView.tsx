import React, {useMemo, useState} from 'react';
import {FlatList, Image, StyleSheet, View} from 'react-native';
import RadioGroup from 'components/RadioGroup';
import GridSVG from 'components/svg/GridSVG';
import {Row} from 'components/Row';
import AvaButton from 'components/AvaButton';
import ListSVG from 'components/svg/ListSVG';
import {NFTItemData} from 'screens/nft/NftCollection';
import ZeroState from 'components/ZeroState';
import AvaListItem from 'components/AvaListItem';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {COLORS_DAY, COLORS_NIGHT} from 'resources/Constants';
import Avatar from 'components/Avatar';
import AvaText from 'components/AvaText';

type ListType = 'grid' | 'list';

export type NftListViewProps = {
  onItemSelected: (item: NFTItemData) => void;
  onManagePressed: () => void;
};

export default function NftListView({
  onItemSelected,
  onManagePressed,
}: NftListViewProps) {
  const {nftRepo} = useApplicationContext().repo;
  const [listType, setListType] = useState<ListType>();
  const {theme} = useApplicationContext();

  const filteredData = useMemo(
    () => [...nftRepo.nfts.values()].filter(value => value.isShowing),
    [nftRepo.nfts],
  );

  return (
    <View style={styles.container}>
      <Row style={styles.topRow}>
        <RadioGroup
          onSelected={selectedItem => setListType(selectedItem as ListType)}
          preselectedKey={'grid'}>
          <GridSVG key={'grid'} size={24} />
          <ListSVG key={'list'} size={24} />
        </RadioGroup>
        <AvaButton.TextMedium onPress={onManagePressed}>
          Manage
        </AvaButton.TextMedium>
      </Row>
      <FlatList
        style={{flex: 1}}
        data={filteredData}
        ListEmptyComponent={<ZeroState.Collectibles />}
        keyExtractor={item => item.token_id}
        ItemSeparatorComponent={() => <View style={{margin: 4}} />}
        renderItem={info =>
          listType === 'list'
            ? renderItemList(info.item, onItemSelected, theme)
            : renderItemGrid(info.item, onItemSelected)
        }
      />
    </View>
  );
}

const renderItemList = (
  item: NFTItemData,
  onItemSelected: (item: NFTItemData) => void,
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
        onPress={() => onItemSelected(item)}
        title={item.token_id}
        subtitle={item.collection.contract_name}
        leftComponent={
          <Avatar.Custom
            name={item.external_data.name}
            logoUri={item.external_data.image_256}
          />
        }
      />
    </View>
  );
};

const renderItemGrid = (
  item: NFTItemData,
  onItemSelected: (item: NFTItemData) => void,
) => {
  return (
    <AvaButton.Base onPress={() => onItemSelected(item)}>
      <AvaText.Heading1>{item.external_data.name}</AvaText.Heading1>
      <Image
        style={{width: '100%', height: 200, borderRadius: 8}}
        source={{uri: item.external_data.image_256}}
      />
    </AvaButton.Base>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  topRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
