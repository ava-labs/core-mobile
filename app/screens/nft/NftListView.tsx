import React, { useEffect, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import RadioGroup from 'components/RadioGroup'
import GridSVG from 'components/svg/GridSVG'
import { Row } from 'components/Row'
import AvaButton from 'components/AvaButton'
import ListSVG from 'components/svg/ListSVG'
import { useApplicationContext } from 'contexts/ApplicationContext'
import {
  clearNfts,
  NFTItemData,
  saveNfts,
  selectHiddenNftUIDs,
  selectNfts
} from 'store/nft'
import { useGetNfts } from 'store/nft/hooks'
import { useDispatch, useSelector } from 'react-redux'
import { NftList } from './components/NftList/NftList'
import { NftGrid } from './components/NftGrid/NftGrid'

type ListType = 'grid' | 'list'

type Props = {
  onItemSelected: (item: NFTItemData) => void
  onManagePressed: () => void
}

export default function NftListView({
  onItemSelected,
  onManagePressed
}: Props) {
  const dispatch = useDispatch()
  const { nfts, fetchNext, refresh, isRefreshing, isLoading, isFetchingNext } =
    useGetNfts()

  useEffect(() => {
    if (isLoading || isRefreshing) {
      dispatch(clearNfts())
    }
  }, [dispatch, isLoading, isRefreshing])

  useEffect(() => {
    if (!isLoading && !isRefreshing) {
      dispatch(saveNfts({ nfts }))
    }
  }, [dispatch, isLoading, isRefreshing, nfts])

  const fullNfts = useSelector(selectNfts)

  const [listType, setListType] = useState<ListType>()
  const { theme } = useApplicationContext()
  const hiddenNfts = useSelector(selectHiddenNftUIDs)

  const filteredData = useMemo(() => {
    return fullNfts.filter(value => !hiddenNfts[value.uid])
  }, [hiddenNfts, fullNfts])

  const renderListToggle = () => (
    <RadioGroup
      onSelected={selectedItem => setListType(selectedItem as ListType)}
      preselectedKey={'grid'}>
      <GridSVG key={'grid'} size={24} />
      <ListSVG key={'list'} size={24} />
    </RadioGroup>
  )

  const renderManageBtn = () => (
    <AvaButton.TextLink
      style={{ paddingRight: -16 }}
      textColor={theme.colorPrimary1}
      onPress={onManagePressed}>
      Manage
    </AvaButton.TextLink>
  )

  const renderList = () => {
    const props = {
      nfts: filteredData,
      onItemSelected,
      isLoading,
      fetchNext,
      isFetchingNext,
      refresh,
      isRefreshing
    }

    return listType === 'list' ? <NftList {...props} /> : <NftGrid {...props} />
  }

  return (
    <View style={styles.container}>
      <Row style={styles.topRow}>
        {renderListToggle()}
        {renderManageBtn()}
      </Row>
      {renderList()}
    </View>
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
