import { XChainBalances } from '@avalabs/glacier-sdk'
import { FlatList, Sx, Text, View } from '@avalabs/k2-mobile'
import { Space } from 'components/Space'
import { useApplicationContext } from 'contexts/ApplicationContext'
import React from 'react'
import { useSearchableTokenList } from 'screens/portfolio/useSearchableTokenList'
import { XTokenWithBalance } from 'store/balance'
import { Avax } from 'types'

const assetDisplayNames = {
  locked: 'Locked',
  unlocked: 'Unlocked',
  atomicMemoryLocked: 'Atomic Memory Locked',
  atomicMemoryUnlocked: 'Atomic Memory Unlocked'
}

export const XChainAssetList = ({
  scrollEnabled = true,
  sx,
  ItemSeparator
}: {
  scrollEnabled?: boolean
  sx?: Sx
  ItemSeparator?: React.ComponentType | null
}): React.JSX.Element => {
  const {
    appHook: { currencyFormatter }
  } = useApplicationContext()
  const { filteredTokenList: tokens } = useSearchableTokenList()

  const xTokenWithBalance = tokens.find(
    token => 'unlocked' in (token.utxos as XChainBalances)
  ) as XTokenWithBalance

  const tokenPrice = xTokenWithBalance.priceInCurrency

  const rednerItem = (assetType: string): JSX.Element | null => {
    // @ts-ignore - we know that the key exists
    const balance = xTokenWithBalance.utxoBalances[assetType] ?? 0
    if (balance === 0) {
      return null
    }
    const balanceInAvax = Avax.fromNanoAvax(balance).toFixed()
    const balanceInCurrency = Avax.fromNanoAvax(balance * tokenPrice).toFixed(2)

    const formattedBalance = currencyFormatter(balanceInCurrency)
    // @ts-ignore - we know that the key exists
    const assetName = assetDisplayNames?.[assetType] ?? assetType

    return (
      <View
        sx={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '$neutral900',
          ...sx
        }}>
        <View
          sx={{
            flexGrow: 1,
            flexShrink: 1,
            flexDirection: 'row',
            justifyContent: 'space-between'
          }}>
          <View
            sx={{
              marginLeft: 8,
              marginRight: 16,
              flexShrink: 1
            }}>
            <Text variant="buttonMedium" numberOfLines={1}>
              {assetName}
            </Text>
            <View sx={{ flexDirection: 'row', flexShrink: 1 }}>
              <Text
                variant="overline"
                sx={{ color: '$neutral50' }}
                ellipsizeMode="tail">
                {balanceInAvax}
              </Text>
              <Space x={4} />
              <Text variant="overline" numberOfLines={1} ellipsizeMode="tail">
                {xTokenWithBalance.symbol}
              </Text>
            </View>
          </View>
          <View
            sx={{
              alignSelf: 'center'
            }}>
            <Text variant="buttonMedium" numberOfLines={1}>
              {formattedBalance}
            </Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <FlatList
      scrollEnabled={scrollEnabled}
      data={Object.keys(xTokenWithBalance.utxoBalances)}
      keyExtractor={(_, index) => index.toString()}
      renderItem={item => rednerItem(item.item as string)}
      ItemSeparatorComponent={ItemSeparator}
    />
  )
}
