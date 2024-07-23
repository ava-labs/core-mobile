import { PChainBalance } from '@avalabs/glacier-sdk'
import { FlatList, Sx, Text, View } from '@avalabs/k2-mobile'
import { TokenWithBalancePVM } from '@avalabs/vm-module-types'
import { Space } from 'components/Space'
import { useApplicationContext } from 'contexts/ApplicationContext'
import React, { useMemo } from 'react'
import { useSearchableTokenList } from 'screens/portfolio/useSearchableTokenList'
import { assetPDisplayNames } from 'store/balance/types'
import { Avax } from 'types'

type ChainBalanceType = keyof PChainBalance

export const PChainAssetList = ({
  limit,
  scrollEnabled = true,
  sx,
  ItemSeparator
}: {
  limit?: number
  scrollEnabled?: boolean
  sx?: Sx
  ItemSeparator?: React.ComponentType | null
}): React.JSX.Element => {
  const {
    appHook: { currencyFormatter }
  } = useApplicationContext()
  const { filteredTokenList: tokens } = useSearchableTokenList()

  const token = tokens.find(
    t => 'unlockedUnstaked' in (t as TokenWithBalancePVM).balancePerType
  ) as TokenWithBalancePVM

  const assetTypes = useMemo(() => {
    return Object.keys(token.balancePerType)
      .sort((a, b) => {
        return Number(
          Avax.fromBase(
            token.balancePerType[b as ChainBalanceType] ?? '0'
          )?.sub(
            Avax.fromBase(token.balancePerType[a as ChainBalanceType] ?? '0')
          )
        )
      })
      .filter(k =>
        Avax.fromBase(token.balancePerType[k as ChainBalanceType] ?? '0')?.gt(0)
      )
  }, [token])

  const shouldLimitAssets = limit && assetTypes.length > limit

  const tokenPrice = token.priceInCurrency

  const rednerItem = (assetType: string): JSX.Element => {
    const balance = token.balancePerType[assetType as ChainBalanceType] ?? 0
    const balanceInAvax = Avax.fromBase(balance.toString()).toDisplay()
    const balanceInCurrency = tokenPrice
      ? Avax.fromBase(balance.toString()).mul(tokenPrice).toDisplay(2)
      : '-'

    const formattedBalance = currencyFormatter(balanceInCurrency)
    const assetName = assetPDisplayNames[assetType]

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

  const renderMoreText = (): JSX.Element | null => {
    const moreText = assetTypes.length - (limit ?? assetTypes.length)

    if (moreText <= 0) return null

    return (
      <Text
        variant="buttonSmall"
        sx={{ marginTop: 4, alignSelf: 'flex-end', color: '$blueMain' }}>
        + {moreText} more
      </Text>
    )
  }

  return (
    <>
      <FlatList
        scrollEnabled={scrollEnabled}
        data={shouldLimitAssets ? assetTypes.slice(0, limit) : assetTypes}
        keyExtractor={(_, index) => index.toString()}
        renderItem={item => rednerItem(item.item as string)}
        ItemSeparatorComponent={ItemSeparator}
      />
      {renderMoreText()}
    </>
  )
}
