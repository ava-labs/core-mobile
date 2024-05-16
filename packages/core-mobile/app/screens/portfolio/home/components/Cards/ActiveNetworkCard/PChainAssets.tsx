import { PChainBalance } from '@avalabs/glacier-sdk'
import { Text, View } from '@avalabs/k2-mobile'
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

export const PChainAssets = (): React.JSX.Element => {
  const {
    appHook: { currencyFormatter }
  } = useApplicationContext()
  const { filteredTokenList: tokens } = useSearchableTokenList()

  const pTokenWithBalance = tokens.find(
    token => 'unlockedUnstaked' in (token.utxos as PChainBalance)
  ) as PTokenWithBalance

  const lastItem = Object.keys(pTokenWithBalance?.utxos).length - 1
  const marginBottom = lastItem ? 0 : 16
  const tokenPrice = pTokenWithBalance.priceInCurrency

  return (
    <>
      {Object.keys(pTokenWithBalance.utxoBalances).map((name, index) => {
        // @ts-ignore - we know that the key exists
        const balance = pTokenWithBalance.utxoBalances[name] ?? 0
        if (balance === 0) {
          return null
        }
        const balanceInAvax = Avax.fromNanoAvax(balance).toFixed()
        const balanceInCurrency = Avax.fromNanoAvax(
          balance * tokenPrice
        ).toFixed(2)

        const formattedBalance = currencyFormatter(balanceInCurrency)
        // @ts-ignore - we know that the key exists
        const assetName = assetDisplayNames?.[name] ?? name

        return (
          <View
            sx={{
              marginBottom,
              flexDirection: 'row',
              alignItems: 'center'
            }}
            key={index.toString()}>
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
                  <Text
                    variant="overline"
                    numberOfLines={1}
                    ellipsizeMode="tail">
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
      })}
    </>
  )
}
