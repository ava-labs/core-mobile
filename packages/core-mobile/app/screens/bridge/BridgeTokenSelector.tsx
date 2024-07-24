import React, { useMemo, useState } from 'react'
import { ListRenderItemInfo, View } from 'react-native'
import { Text } from '@avalabs/k2-mobile'
import Loader from 'components/Loader'
import { Space } from 'components/Space'
import { Asset, BIG_ZERO, useTokenInfoContext } from '@avalabs/bridge-sdk'
import AvaListItem from 'components/AvaListItem'
import Avatar from 'components/Avatar'
import { formatTokenAmount } from 'utils/Utils'
import SearchBar from 'components/SearchBar'
import { BridgeAsset } from '@avalabs/bridge-unified'
import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { AssetBalance } from 'screens/bridge/utils/types'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { isUnifiedBridgeAsset } from './utils/bridgeUtils'

const DEFAULT_HORIZONTAL_MARGIN = 16

// for future use
export enum SelectTokenMode {
  CONVERT = 'convert', // only list tokens which can be converted and have deprecated token address
  TRANSFER = 'transfer' // list all tokens
}

interface TokenSelectorProps {
  onTokenSelected: (token: AssetBalance) => void
  bridgeTokenList: AssetBalance[]
  horizontalMargin?: number
  selectMode: SelectTokenMode
}

const getTokenName = (asset: Asset | BridgeAsset): string => {
  return isUnifiedBridgeAsset(asset) ? asset.name : asset.tokenName
}

function BridgeTokenSelector({
  onTokenSelected,
  bridgeTokenList,
  horizontalMargin = DEFAULT_HORIZONTAL_MARGIN
}: TokenSelectorProps): JSX.Element {
  const [searchText, setSearchText] = useState('')
  const tokenInfoData = useTokenInfoContext()

  const renderItem = (item: ListRenderItemInfo<AssetBalance>): JSX.Element => {
    const token = item.item
    const symbol = token.asset.symbol
    const name = getTokenName(token.asset)

    const title = token.symbolOnNetwork
      ? `${name} (${token.symbolOnNetwork})`
      : name

    const tokenLogo = (): JSX.Element => {
      return (
        <Avatar.Custom
          name={name}
          symbol={symbol}
          logoUri={tokenInfoData?.[token.symbol]?.logo}
        />
      )
    }

    return (
      <AvaListItem.Base
        title={title}
        leftComponent={tokenLogo()}
        rightComponentVerticalAlignment={'center'}
        rightComponent={
          <Text variant="body1" style={{ marginLeft: 12 }}>
            {formatTokenAmount(token.balance || BIG_ZERO, 6)} {token.symbol}
          </Text>
        }
        onPress={() => {
          onTokenSelected(token)
          AnalyticsService.capture('Bridge_TokenSelected')
        }}
      />
    )
  }

  /**
   * filter
   */
  const tokens = useMemo(() => {
    return searchText && searchText.length > 0
      ? bridgeTokenList?.filter(
          i =>
            getTokenName(i.asset)
              ?.toLowerCase()
              .includes(searchText.toLowerCase()) ||
            i.symbol?.toLowerCase().includes(searchText.toLowerCase())
        )
      : bridgeTokenList
  }, [bridgeTokenList, searchText])

  return (
    <View style={{ flex: 1, marginHorizontal: horizontalMargin }}>
      <SearchBar onTextChanged={setSearchText} searchText={searchText} />
      <Space y={16} />
      {!bridgeTokenList ? (
        <Loader />
      ) : (
        <BottomSheetFlatList
          keyboardShouldPersistTaps="handled"
          data={tokens}
          renderItem={renderItem}
          refreshing={false}
          keyExtractor={(item: AssetBalance, index) => item.symbol + index}
        />
      )}
    </View>
  )
}

export default BridgeTokenSelector
