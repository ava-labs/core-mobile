import { isTokenWithBalanceAVM } from '@avalabs/avalanche-module'
import { XChainBalances } from '@avalabs/glacier-sdk'
import { FlatList, Sx, Text, View } from '@avalabs/k2-mobile'
import { Space } from 'components/Space'
import React, { useMemo } from 'react'
import { useSearchableTokenList } from 'screens/portfolio/useSearchableTokenList'
import { assetXDisplayNames } from 'store/balance/types'
import { TokenUnit } from '@avalabs/core-utils-sdk'

type ChainBalanceType = keyof XChainBalances

export const XChainAssetList = ({
  scrollEnabled = true,
  sx,
  ItemSeparator
}: {
  scrollEnabled?: boolean
  sx?: Sx
  ItemSeparator?: React.ComponentType | null
}): React.JSX.Element => {
  const { filteredTokenList: tokens } = useSearchableTokenList()

  const token = tokens.find(t => isTokenWithBalanceAVM(t))

  const assetTypes = useMemo(() => {
    return token && isTokenWithBalanceAVM(token)
      ? Object.keys(token.balancePerType)
          .sort((a, b) =>
            Number(
              (token.balancePerType[b as ChainBalanceType] ?? 0n) -
                (token.balancePerType[a as ChainBalanceType] ?? 0n)
            )
          )
          .filter(k => (token.balancePerType[k as ChainBalanceType] ?? 0) > 0)
      : []
  }, [token])

  const renderItem = (assetType: string): JSX.Element => {
    const balanceNAvax =
      token && isTokenWithBalanceAVM(token)
        ? token.balancePerType[assetType as ChainBalanceType]
        : 0
    const balanceInAvax =
      token && 'decimals' in token && balanceNAvax
        ? new TokenUnit(balanceNAvax, token.decimals, token.symbol)
        : undefined

    const formattedBalance =
      token?.priceInCurrency && balanceInAvax
        ? balanceInAvax.mul(token.priceInCurrency).toDisplay({ fixedDp: 2 })
        : '-'

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
                {balanceInAvax?.toDisplay() ?? '-'}
              </Text>
              <Space x={4} />
              <Text variant="overline" numberOfLines={1} ellipsizeMode="tail">
                {token?.symbol ?? ''}
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
