import { bigIntToString, TokenUnit } from '@avalabs/core-utils-sdk'
import { GroupList, Text, View } from '@avalabs/k2-alpine'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { useMarketTokenBySymbol } from 'common/hooks/useMarketTokenBySymbol'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { Limit, SpendLimit } from 'hooks/useSpendLimits'
import { DropdownGroup } from 'new/common/components/DropdownMenu'
import { DropdownMenuIcon } from 'new/common/components/DropdownMenuIcons'
import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency/slice'
import { SpendLimitOptions } from './SpendLimitOptions'
import { MenuId } from './types'
import { getDefaultSpendLimitValue } from './utils'

export const SpendLimits = ({
  spendLimits,
  onSelect,
  hasBalanceChange
}: {
  spendLimits: SpendLimit[]
  hasBalanceChange?: boolean
  onSelect?: (spendLimit: SpendLimit) => void
}): JSX.Element | null => {
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
  const marketToken = useMarketTokenBySymbol({ symbol: tokenSymbol })

  const [amount, amountInCurrency] = useMemo(() => {
    if (limitType === Limit.UNLIMITED) return ['∞', undefined]

    if (!tokenValue || !tokenDecimals || !tokenSymbol)
      return [UNKNOWN_AMOUNT, undefined]

    const amountToDisplay = new TokenUnit(
      tokenValue,
      tokenDecimals,
      tokenSymbol
    ).toDisplay()

    if (!marketToken || !marketToken.currentPrice)
      return [amountToDisplay, undefined]

    const amountInCurrencyToDisplay = `${formatTokenInCurrency({
      amount:
        Number(bigIntToString(tokenValue, tokenDecimals)) *
        marketToken.currentPrice
    })} ${selectedCurrency}`

    return [amountToDisplay, amountInCurrencyToDisplay]
  }, [
    limitType,
    tokenValue,
    tokenDecimals,
    tokenSymbol,
    marketToken,
    formatTokenInCurrency,
    selectedCurrency
  ])

  const renderSpendLimit = (): JSX.Element | null => {
    if (hasBalanceChange) return null

    return (
      <View
        sx={{
          backgroundColor: '$surfaceSecondary',
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
    )
  }

  return (
    <View style={{ gap: 12 }}>
      {renderSpendLimit()}
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
