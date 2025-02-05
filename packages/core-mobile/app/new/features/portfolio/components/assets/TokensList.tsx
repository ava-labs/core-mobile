import React, { useMemo, useState } from 'react'
import { LocalTokenWithBalance } from 'store/balance'
import {
  FlatList,
  IndexPath,
  ScrollView,
  SquareButton,
  SquareButtonIconType,
  View
} from '@avalabs/k2-alpine'
import { Space } from 'components/Space'
import { sortUndefined } from 'common/utils/sortUndefined'
import {
  ASSET_NETWORK_FILTERS,
  ASSET_BALANCE_SORTS,
  AssetNetworkFilter,
  AssetsDropdown,
  AssetBalanceSort
} from './AssetsDrowndown'
import { AssetToken } from './AssetToken'
import { AssetsManageView } from './AssetsView'

const BUTTONS: { title: string; icon: SquareButtonIconType }[] = [
  { title: 'Bridge', icon: 'bridge' },
  { title: 'Swap', icon: 'swap' },
  { title: 'Send', icon: 'send' },
  { title: 'Buy', icon: 'buy' },
  { title: 'Connect', icon: 'connect' }
]

interface Props {
  tokens: LocalTokenWithBalance[]
}

export const TokensList = ({ tokens }: Props): React.JSX.Element => {
  const [selectedFilter, setSelectedFilter] = useState<IndexPath>({
    section: 0,
    row: 0
  })

  const [selectedSort, setSelectedSort] = useState<IndexPath>({
    section: 0,
    row: 0
  })

  const filtered = useMemo(() => {
    const filter =
      ASSET_NETWORK_FILTERS?.[selectedFilter.section]?.[selectedFilter.row]

    if (filter === AssetNetworkFilter.AllNetworks) {
      return tokens
    }
    if (filter === AssetNetworkFilter.AvalancheCChain) {
      return tokens.filter(
        token =>
          'chainId' in token &&
          (token.chainId === 43114 || token.chainId === 43113)
      )
    }
    if (filter === AssetNetworkFilter.Ethereum) {
      return tokens.filter(
        token =>
          'chainId' in token &&
          (token.chainId === 1 ||
            token.chainId === 5 ||
            token.chainId === 11155111)
      )
    }
    if (filter === AssetNetworkFilter.BitcoinNetwork) {
      return tokens.filter(token => token.symbol === 'BTC')
    }
  }, [selectedFilter, tokens])

  const sorted = useMemo(() => {
    const sort = ASSET_BALANCE_SORTS?.[selectedSort.section]?.[selectedSort.row]

    if (sort === AssetBalanceSort.LowToHigh) {
      return filtered?.sort((a, b) =>
        sortUndefined(a.balanceInCurrency, b.balanceInCurrency)
      )
    }

    if (sort === AssetBalanceSort.HighToLow) {
      return filtered?.sort((a, b) =>
        sortUndefined(b.balanceInCurrency, a.balanceInCurrency)
      )
    }
  }, [filtered, selectedSort])

  const renderOptions = (): React.JSX.Element => {
    return (
      <View
        sx={{
          marginTop: 19,
          marginBottom: 16,
          justifyContent: 'space-between',
          flexDirection: 'row'
        }}>
        <View sx={{ flexDirection: 'row', gap: 8 }}>
          <AssetsDropdown
            name={'Filter'}
            options={ASSET_NETWORK_FILTERS}
            selectedValue={selectedFilter}
            setSelectedValue={setSelectedFilter}
          />
          <AssetsDropdown
            name={'Sort'}
            options={ASSET_BALANCE_SORTS}
            selectedValue={selectedSort}
            setSelectedValue={setSelectedSort}
          />
        </View>
        <AssetsManageView />
      </View>
    )
  }

  const renderItem = (token: LocalTokenWithBalance): React.JSX.Element => {
    return <AssetToken token={token} />
  }

  const renderSeparator = (): React.JSX.Element => {
    return <Space y={10} />
  }

  const renderListHeader = (): React.JSX.Element => {
    return (
      <View>
        <ScrollView
          showsHorizontalScrollIndicator={false}
          horizontal
          sx={{ flexGrow: 0 }}
          contentContainerStyle={{
            width: '100%'
          }}>
          <View style={{ gap: 10, flexDirection: 'row' }}>
            {BUTTONS.map((button, index) => (
              <SquareButton
                key={index}
                title={button.title}
                icon={button.icon}
              />
            ))}
          </View>
        </ScrollView>
        {renderOptions()}
      </View>
    )
  }

  return (
    <View sx={{ marginTop: 30 }}>
      <FlatList
        ListHeaderComponent={renderListHeader}
        data={sorted}
        renderItem={item => renderItem(item.item as LocalTokenWithBalance)}
        ItemSeparatorComponent={renderSeparator}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}
