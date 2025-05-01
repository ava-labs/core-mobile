import { Limit, SpendLimit } from 'hooks/useSpendLimits'
import React, { useMemo } from 'react'
import { View, GroupList, Text } from '@avalabs/k2-alpine'
import { DropdownMenuIcon } from 'new/common/components/DropdownMenuIcons'
import { DropdownGroup } from 'new/common/components/DropdownMenu'
import { bigIntToString, TokenUnit } from '@avalabs/core-utils-sdk'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency/slice'
import { getDefaultSpendLimitValue } from './utils'
import { MenuId } from './types'
import { SpendLimitOptions } from './SpendLimitOptions'

export const SpendLimits = ({
  spendLimits,
  onSelect
}: {
  spendLimits: SpendLimit[]
  onSelect?: (spendLimit: SpendLimit) => void
}): JSX.Element | null => {
  const { getMarketTokenBySymbol } = useWatchlist()
  const { formatTokenInCurrency } = useFormatCurrency()
  const selectedCurrency = useSelector(selectSelectedCurrency)

  const spendLimit = spendLimits[0]

  const data = useMemo(() => {
    if (!spendLimit) return []

    const defaultSpendLimitValue = getDefaultSpendLimitValue(spendLimit)
    const token = spendLimit.tokenApproval.token

    const menuItems: DropdownGroup[] = [
      {
        id: 'spendLimitItems',
        items: [
          {
            id: MenuId.DEFAULT,
            title: `${defaultSpendLimitValue} ${token.symbol} - Default`,
            icon:
              spendLimit.limitType === Limit.DEFAULT
                ? DropdownMenuIcon.Check
                : undefined
          },
          {
            id: MenuId.UNLIMITED,
            title: 'Unlimited',
            icon:
              spendLimit.limitType === Limit.UNLIMITED
                ? DropdownMenuIcon.Check
                : undefined
          },
          {
            id: MenuId.CUSTOM,
            title: 'Custom',
            icon:
              spendLimit.limitType === Limit.CUSTOM
                ? DropdownMenuIcon.Check
                : undefined
          }
        ]
      }
    ]

    return [
      {
        title: 'Spend limit',
        value: (
          <SpendLimitOptions
            spendLimit={spendLimit}
            menuItems={menuItems}
            onSelect={onSelect}
          />
        )
      }
    ]
  }, [spendLimit, onSelect])

  const tokenValue = spendLimit?.value?.bn
  const tokenDecimals =
    spendLimit &&
    spendLimit.tokenApproval.token &&
    'decimals' in spendLimit.tokenApproval.token
      ? spendLimit.tokenApproval.token.decimals
      : 0
  const tokenSymbol = spendLimit?.tokenApproval.token.symbol
  const limitType = spendLimit?.limitType

  const [amount, amountInCurrency] = useMemo(() => {
    if (limitType === Limit.UNLIMITED) return ['∞', undefined]

    if (!tokenValue || !tokenDecimals || !tokenSymbol)
      return [UNKNOWN_AMOUNT, undefined]

    const amountToDisplay = new TokenUnit(
      tokenValue,
      tokenDecimals,
      tokenSymbol
    ).toDisplay()

    const marketToken = getMarketTokenBySymbol(tokenSymbol)

    if (!marketToken || !marketToken.currentPrice)
      return [amountToDisplay, undefined]

    const amountInCurrencyToDisplay = `${formatTokenInCurrency({
      amount:
        Number(bigIntToString(tokenValue, tokenDecimals)) *
        marketToken.currentPrice
    })} ${selectedCurrency}`

    return [amountToDisplay, amountInCurrencyToDisplay]
  }, [
    tokenValue,
    tokenDecimals,
    tokenSymbol,
    limitType,
    formatTokenInCurrency,
    selectedCurrency,
    getMarketTokenBySymbol
  ])

  return (
    <View style={{ marginBottom: 12 }}>
      <View
        sx={{
          backgroundColor: '$surfaceSecondary',
          marginBottom: 12,
          paddingHorizontal: 16,
          paddingBottom: 17,
          paddingTop: 25,
          borderRadius: 12,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        <View
          sx={{
            flexDirection: 'row'
          }}>
          <View style={{ maxWidth: '80%' }}>
            <Text
              variant="heading1"
              numberOfLines={1}
              sx={{ color: '$textPrimary', fontSize: 50, lineHeight: 50 }}>
              {amount}
            </Text>
          </View>
          {limitType !== Limit.UNLIMITED && (
            <Text
              variant="heading1"
              sx={{
                color: '$textPrimary',
                marginLeft: 3,
                marginTop: 3,
                fontSize: 24,
                lineHeight: 24
              }}>
              {tokenSymbol}
            </Text>
          )}
        </View>
        {amountInCurrency && (
          <View style={{ maxWidth: '70%' }}>
            <Text
              variant="body1"
              numberOfLines={1}
              sx={{ color: '$textPrimary', fontSize: 13, lineHeight: 16 }}>
              {amountInCurrency}
            </Text>
          </View>
        )}
      </View>
      <GroupList
        data={data}
        titleSx={{
          fontFamily: 'Inter-Regular',
          fontSize: 16,
          lineHeight: 22,
          color: '$textPrimary'
        }}
      />
    </View>
  )
}
