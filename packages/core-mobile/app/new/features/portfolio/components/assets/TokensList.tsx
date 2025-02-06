import React from 'react'
import { LocalTokenWithBalance } from 'store/balance'
import { FlatList, View } from '@avalabs/k2-alpine'
import { Space } from 'components/Space'
import { AssetToken } from './AssetToken'
import { useFilterAndSort } from './useFilterAndSort'
import { AssetsHeader } from './AssetsHeader'

interface Props {
  tokens: LocalTokenWithBalance[]
}

export const TokensList = ({ tokens }: Props): React.JSX.Element => {
  const {
    sorted,
    selectedFilter,
    selectedSort,
    setSelectedFilter,
    setSelectedSort
  } = useFilterAndSort(tokens)

  const renderItem = (token: LocalTokenWithBalance): React.JSX.Element => {
    return <AssetToken token={token} />
  }

  const renderSeparator = (): React.JSX.Element => {
    return <Space y={10} />
  }

  return (
    <View sx={{ marginTop: 30 }}>
      <FlatList
        ListHeaderComponent={
          <AssetsHeader
            selectedFilter={selectedFilter}
            selectedSort={selectedSort}
            setSelectedFilter={setSelectedFilter}
            setSelectedSort={setSelectedSort}
          />
        }
        data={sorted}
        renderItem={item => renderItem(item.item as LocalTokenWithBalance)}
        ItemSeparatorComponent={renderSeparator}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}
