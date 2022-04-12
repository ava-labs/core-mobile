import React, {useMemo, useState} from 'react'
import {Dimensions, FlatList, Image, StyleSheet, View} from 'react-native'
import RadioGroup from 'components/RadioGroup'
import GridSVG from 'components/svg/GridSVG'
import {Row} from 'components/Row'
import AvaButton from 'components/AvaButton'
import ListSVG from 'components/svg/ListSVG'
import {NFTItemData} from 'screens/nft/NftCollection'
import ZeroState from 'components/ZeroState'
import AvaListItem from 'components/AvaListItem'
import {useApplicationContext} from 'contexts/ApplicationContext'
import {COLORS_DAY, COLORS_NIGHT, Opacity85} from 'resources/Constants'
import Avatar from 'components/Avatar'
import MasonryList from '@react-native-seoul/masonry-list'
import AvaText from 'components/AvaText'

type ListType = 'grid' | 'list'

export type NftListViewProps = {
  onItemSelected: (item: NFTItemData) => void
  onManagePressed: () => void
}

const SCREEN_WIDTH = Dimensions.get('window')?.width
const GRID_ITEM_MARGIN = 8
const PARENT_PADDING = 16
const GRID_ITEM_WIDTH =
  (SCREEN_WIDTH - GRID_ITEM_MARGIN * 4 - PARENT_PADDING * 2) / 2

export default function NftListView({
  onItemSelected,
  onManagePressed
}: NftListViewProps) {
  const {nftRepo} = useApplicationContext().repo
  const [listType, setListType] = useState<ListType>()
  const {theme} = useApplicationContext()

  const filteredData = useMemo(
    () =>
      [...nftRepo.nfts.values()].filter(
        value => value.isShowing && !!value.aspect
      ),
    [nftRepo.nfts]
  )

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
      {listType === 'list' ? (
        <FlatList
          style={{flex: 1}}
          data={filteredData}
          ListEmptyComponent={<ZeroState.Collectibles />}
          keyExtractor={item => item.uid}
          ItemSeparatorComponent={() => <View style={{margin: 4}} />}
          renderItem={info => renderItemList(info.item, onItemSelected, theme)}
        />
      ) : (
        <MasonryList
          data={filteredData}
          keyExtractor={(item: NFTItemData) => item.uid}
          numColumns={2}
          showsVerticalScrollIndicator={true}
          renderItem={info => renderItemGrid(info.item, onItemSelected)}
        />
      )}
    </View>
  )
}

const renderItemList = (
  item: NFTItemData,
  onItemSelected: (item: NFTItemData) => void,
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
        onPress={() => onItemSelected(item)}
        titleAlignment={'flex-start'}
        title={
          <AvaText.Heading2 ellipsizeMode={'tail'}>
            #{item.token_id}
          </AvaText.Heading2>
        }
        subtitle={
          <AvaText.Body2 ellipsizeMode={'tail'}>
            {item.collection.contract_name}
          </AvaText.Body2>
        }
        leftComponent={
          <Avatar.Custom
            size={40}
            name={item.external_data.name}
            logoUri={item.external_data.image_256}
          />
        }
      />
    </View>
  )
}

const renderItemGrid = (
  item: NFTItemData,
  onItemSelected: (item: NFTItemData) => void
) => {
  return (
    <AvaButton.Base
      key={item.uid}
      onPress={() => onItemSelected(item)}
      style={{margin: GRID_ITEM_MARGIN}}>
      <Image
        style={{
          width: GRID_ITEM_WIDTH,
          height: item.aspect * GRID_ITEM_WIDTH,
          borderRadius: 8
        }}
        source={{uri: item.external_data.image_512}}
      />
    </AvaButton.Base>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16
  },
  topRow: {
    alignItems: 'center',
    justifyContent: 'space-between'
  }
})
