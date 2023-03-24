import React, { useMemo, useState } from 'react'
import { ListRenderItemInfo, View } from 'react-native'
import Loader from 'components/Loader'
import { Space } from 'components/Space'
import { BIG_ZERO, useTokenInfoContext } from '@avalabs/bridge-sdk'
import AvaListItem from 'components/AvaListItem'
import AvaText from 'components/AvaText'
import Avatar from 'components/Avatar'
import { formatTokenAmount } from 'utils/Utils'
import SearchBar from 'components/SearchBar'

import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { AssetBalance } from 'screens/bridge/utils/types'
import { usePostCapture } from 'hooks/usePosthogCapture'

const DEFAULT_HORIZONTAL_MARGIN = 16

// for future use
export enum SelectTokenMode {
  CONVERT = 'convert', // only list tokens which can be converted and have deprecated token address
  TRANSFER = 'transfer' // list all tokens
}

interface TokenSelectorProps {
  onTokenSelected: (symbol: string) => void
  bridgeTokenList: AssetBalance[]
  horizontalMargin?: number
  selectMode: SelectTokenMode
}

function BridgeTokenSelector({
  onTokenSelected,
  bridgeTokenList,
  horizontalMargin = DEFAULT_HORIZONTAL_MARGIN
}: TokenSelectorProps) {
  const [searchText, setSearchText] = useState('')
  const tokenInfoData = useTokenInfoContext()
  const { capture } = usePostCapture()

  const renderItem = (item: ListRenderItemInfo<AssetBalance>) => {
    const token = item.item
    const symbol = token.asset.symbol
    const name = token.symbol === 'ETH' ? 'Ethereum' : token.asset.tokenName

    const tokenLogo = () => {
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
        title={name}
        leftComponent={tokenLogo()}
        rightComponentVerticalAlignment={'center'}
        rightComponent={
          <>
            <AvaText.Body1>
              {formatTokenAmount(token.balance || BIG_ZERO, 6)} {token.symbol}
            </AvaText.Body1>
          </>
        }
        onPress={() => {
          onTokenSelected(symbol)
          capture('Bridge_TokenSelected')
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
            i.asset.tokenName
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
