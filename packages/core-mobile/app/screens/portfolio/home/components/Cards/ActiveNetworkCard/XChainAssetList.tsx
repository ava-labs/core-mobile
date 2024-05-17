import { XChainBalances } from '@avalabs/glacier-sdk'
import { FlatList, Sx, Text, View } from '@avalabs/k2-mobile'
import { Space } from 'components/Space'
import { useApplicationContext } from 'contexts/ApplicationContext'
import React, { useMemo } from 'react'
import { useSearchableTokenList } from 'screens/portfolio/useSearchableTokenList'
import { XTokenWithBalance, assetXDisplayNames } from 'store/balance'
import { Avax } from 'types'

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

  const token = tokens.find(
    t => 'unlocked' in (t.utxos as XChainBalances)
  ) as XTokenWithBalance

  const tokenPrice = token.priceInCurrency

  const assetTypes = useMemo(() => {
    return Object.keys(token.utxoBalances)
      .sort((a, b) =>
        Number(
          (token.utxoBalances[b] ?? new Avax(0))?.sub(
            token.utxoBalances[a] ?? new Avax(0)
          )
        )
      )
      .filter(k => token.utxoBalances[k]?.gt(0))
  }, [token])

  const renderItem = (assetType: string): JSX.Element => {
    const balance = token.utxoBalances[assetType] ?? 0
    const balanceInAvax = Avax.fromNanoAvax(balance.toString()).toDisplay()
    const balanceInCurrency = Avax.fromNanoAvax(balance.toString())
      .mul(tokenPrice)
      .toDisplay(2)

    const formattedBalance = currencyFormatter(balanceInCurrency)
    const assetName = assetXDisplayNames[assetType]

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
                {token.symbol}
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
      data={assetTypes}
      keyExtractor={(_, index) => index.toString()}
      renderItem={item => renderItem(item.item as string)}
      ItemSeparatorComponent={ItemSeparator}
    />
  )
}
