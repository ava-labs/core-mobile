import React from 'react'
import { LocalTokenWithBalance } from 'store/balance'
import { alpha, FlatList, useTheme, View } from '@avalabs/k2-alpine'
import { Space } from 'components/Space'
import { LinearGradient } from 'expo-linear-gradient'
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
  const {
    theme: { colors }
  } = useTheme()

  const renderItem = (token: LocalTokenWithBalance): React.JSX.Element => {
    return <AssetToken token={token} />
  }

  const renderSeparator = (): React.JSX.Element => {
    return <Space y={10} />
  }

  return (
    <View sx={{ marginTop: 30, flex: 1 }}>
      <AssetsHeader
        selectedFilter={selectedFilter}
        selectedSort={selectedSort}
        setSelectedFilter={setSelectedFilter}
        setSelectedSort={setSelectedSort}
      />
      <View
        sx={{
          flex: 1,
          zIndex: 1
        }}>
        <LinearGradient
          colors={[colors.$surfacePrimary, alpha(colors.$surfacePrimary, 0)]}
          style={{ height: 40 }}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.5 }}
        />
      </View>
      <FlatList
        data={sorted}
        renderItem={item => renderItem(item.item as LocalTokenWithBalance)}
        ItemSeparatorComponent={renderSeparator}
        showsVerticalScrollIndicator={false}
      />
      <View
        sx={{
          flex: 1,
          bottom: 40,
          zIndex: 1
        }}>
        <LinearGradient
          colors={[alpha(colors.$surfacePrimary, 0), colors.$surfacePrimary]}
          style={{ height: 80 }}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.5 }}
        />
      </View>
    </View>
  )
}
