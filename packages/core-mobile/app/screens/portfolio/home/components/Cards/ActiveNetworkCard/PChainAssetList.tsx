import { PChainBalance } from '@avalabs/glacier-sdk'
import { FlatList, Sx, Text, View } from '@avalabs/k2-mobile'
import { Space } from 'components/Space'
import { useApplicationContext } from 'contexts/ApplicationContext'
import React from 'react'
import { useSearchableTokenList } from 'screens/portfolio/useSearchableTokenList'
import { PTokenWithBalance } from 'store/balance'
import { Avax } from 'types'

const assetDisplayNames = {
  lockedStaked: 'Locked Staked',
  lockedStakeable: 'Locked Stakeable',
  lockedPlatform: 'Locked Platform',
  atomicMemoryLocked: 'Atomic Memory Locked',
  atomicMemoryUnlocked: 'Atomic Memory Unlocked',
  unlockedUnstaked: 'Unlocked Unstaked',
  unlockedStaked: 'Unlocked Staked',
  pendingStaked: 'Pending Staked'
}

export const PChainAssetList = ({
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

  const pTokenWithBalance = tokens.find(
    token => 'unlockedUnstaked' in (token.utxos as PChainBalance)
  ) as PTokenWithBalance

  const tokenPrice = pTokenWithBalance.priceInCurrency

  const rednerItem = (assetType: string): JSX.Element | null => {
    // @ts-ignore - we know that the key exists
    const balance = pTokenWithBalance.utxoBalances[assetType] ?? 0
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
            flexDirection: 'row',
            justifyContent: 'space-between'
          }}>
          <View
            sx={{
              marginLeft: 8,
              marginRight: 16
            }}>
            <Text variant="buttonMedium" numberOfLines={1}>
              {assetName}
            </Text>
            <View sx={{ flexDirection: 'row' }}>
              <Text
                variant="overline"
                sx={{ color: '$neutral50' }}
                ellipsizeMode="tail">
                {balanceInAvax}
              </Text>
              <Space x={4} />
              <Text variant="overline" numberOfLines={1} ellipsizeMode="tail">
                {pTokenWithBalance.symbol}
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
      data={Object.keys(pTokenWithBalance.utxoBalances)}
      keyExtractor={(_, index) => index.toString()}
      renderItem={item => rednerItem(item.item as string)}
      ItemSeparatorComponent={ItemSeparator}
    />
  )
}
