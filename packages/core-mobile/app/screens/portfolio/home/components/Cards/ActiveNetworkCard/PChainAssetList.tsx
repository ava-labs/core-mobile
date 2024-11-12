import { isTokenWithBalancePVM } from '@avalabs/avalanche-module'
import { PChainBalance } from '@avalabs/glacier-sdk'
import { FlatList, Sx, Text, View } from '@avalabs/k2-mobile'
import { Space } from 'components/Space'
import React, { useMemo } from 'react'
import { useSearchableTokenList } from 'screens/portfolio/useSearchableTokenList'
import { assetPDisplayNames } from 'store/balance/types'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { xpChainToken } from 'utils/units/knownTokens'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'

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
  const { filteredTokenList: tokens } = useSearchableTokenList()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const token = tokens.find(t => isTokenWithBalancePVM(t))

  const assetTypes = useMemo(() => {
    return token && isTokenWithBalancePVM(token)
      ? Object.keys(token.balancePerType)
          .sort((a, b) => {
            return Number(
              (token.balancePerType[b as ChainBalanceType] ?? 0n) -
                (token.balancePerType[a as ChainBalanceType] ?? 0n)
            )
          })
          .filter(k => (token.balancePerType[k as ChainBalanceType] ?? 0) > 0)
      : []
  }, [token])

  const shouldLimitAssets = limit && assetTypes.length > limit

  const renderItem = (assetType: string): JSX.Element => {
    const balance =
      token && isTokenWithBalancePVM(token)
        ? token.balancePerType[assetType as ChainBalanceType]
        : 0
    const balanceInAvax = balance
      ? new TokenUnit(balance, xpChainToken.maxDecimals, xpChainToken.symbol)
      : undefined

    const formattedBalance =
      balanceInAvax
        ?.mul(token?.priceInCurrency ?? 0)
        .toDisplay({ fixedDp: 2 }) ?? UNKNOWN_AMOUNT

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
                {balanceInAvax?.toDisplay() ?? UNKNOWN_AMOUNT}
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
              {`${formattedBalance} ${selectedCurrency}`}
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
        renderItem={item => renderItem(item.item as string)}
        ItemSeparatorComponent={ItemSeparator}
      />
      {renderMoreText()}
    </>
  )
}
