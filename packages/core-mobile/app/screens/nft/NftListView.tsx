import React, { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import RadioGroup from 'components/RadioGroup'
import GridSVG from 'components/svg/GridSVG'
import { Row } from 'components/Row'
import AvaButton from 'components/AvaButton'
import ListSVG from 'components/svg/ListSVG'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useNftItemsContext } from 'contexts/NftItemsContext'
import { NftItem } from 'services/nft/types'
import { NftList } from './components/NftList/NftList'
import { NftGrid } from './components/NftGrid/NftGrid'

type ListType = 'grid' | 'list'

type Props = {
  onItemSelected: (item: NftItem) => void
  onManagePressed: () => void
}

export default function NftListView({
  onItemSelected,
  onManagePressed
}: Props): JSX.Element {
  const { setNftsLoadEnabled } = useNftItemsContext()

  const [listType, setListType] = useState<ListType>()
  const { theme } = useApplicationContext()

  useEffect(() => {
    setNftsLoadEnabled(true)
  }, [setNftsLoadEnabled])

  return (
    <View style={styles.container}>
      <Row style={styles.topRow}>
        <RadioGroup
          onSelected={selectedItem => setListType(selectedItem as ListType)}
          preselectedKey={'grid'}>
          <GridSVG key={'grid'} size={24} />
          <ListSVG key={'list'} size={24} />
        </RadioGroup>
        <AvaButton.TextLink
          style={{ paddingRight: -16 }}
          textColor={theme.colorPrimary1}
          onPress={onManagePressed}>
          Manage
        </AvaButton.TextLink>
      </Row>
      {listType === 'list' ? (
        <NftList onItemSelected={onItemSelected} />
      ) : (
        <NftGrid onItemSelected={onItemSelected} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  topRow: {
    alignItems: 'center',
    justifyContent: 'space-between',

    paddingHorizontal: 16
  }
})
