import { XChainBalances } from '@avalabs/glacier-sdk'
import { Text, View } from '@avalabs/k2-mobile'
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

export const XChainAssets = (): JSX.Element => {
  const {
    appHook: { currencyFormatter }
  } = useApplicationContext()
  const { filteredTokenList: tokens } = useSearchableTokenList()

  const xTokenWithBalance = tokens.find(
    token => 'unlocked' in (token.utxos as XChainBalances)
  ) as XTokenWithBalance

  const lastItem = Object.keys(xTokenWithBalance?.utxos).length - 1
  const marginBottom = lastItem ? 0 : 16
  const tokenPrice = xTokenWithBalance.priceInCurrency

  return (
    <>
      {Object.keys(xTokenWithBalance.utxoBalances).map((name, index) => {
        // @ts-ignore - we know that the key exists
        const balance = xTokenWithBalance.utxoBalances[name] ?? 0
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
      })}
    </>
  )
}
