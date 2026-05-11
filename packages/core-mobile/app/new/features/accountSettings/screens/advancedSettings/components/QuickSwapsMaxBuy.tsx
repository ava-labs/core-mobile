import { GroupList, Text, useTheme, View } from '@avalabs/k2-alpine'
import { DropdownGroup, DropdownMenu } from 'common/components/DropdownMenu'
import { DropdownMenuIcon } from 'common/components/DropdownMenuIcons'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectQuickSwapsMaxBuy,
  setQuickSwapsMaxBuy
} from 'store/settings/advanced'
import {
  QUICK_SWAP_MAX_BUY_VALUES,
  QuickSwapMaxBuy
} from 'store/settings/advanced/types'

export const QuickSwapsMaxBuy = (): React.JSX.Element => {
  const { theme } = useTheme()
  const dispatch = useDispatch()
  const maxBuy = useSelector(selectQuickSwapsMaxBuy)
  const { formatIntegerCurrency } = useFormatCurrency()

  const formatMaxBuy = useCallback(
    (value: QuickSwapMaxBuy): string =>
      value === 'unlimited'
        ? 'Unlimited'
        : formatIntegerCurrency({ amount: Number(value) }),
    [formatIntegerCurrency]
  )

  const maxBuyMenuGroups: DropdownGroup[] = [
    {
      id: 'quick-swaps-max-buy',
      items: QUICK_SWAP_MAX_BUY_VALUES.map(value => ({
        id: value,
        title: formatMaxBuy(value),
        icon: maxBuy === value ? DropdownMenuIcon.Check : undefined
      }))
    }
  ]

  const onPressMaxBuyAction = useCallback(
    ({ nativeEvent }: { nativeEvent: { event: string } }) => {
      const next = nativeEvent.event as QuickSwapMaxBuy
      if (QUICK_SWAP_MAX_BUY_VALUES.includes(next)) {
        dispatch(setQuickSwapsMaxBuy(next))
      }
    },
    [dispatch]
  )

  const limitData = [
    {
      title: 'Swap amount limit',
      value: (
        <View style={{ marginRight: -16 }}>
          <DropdownMenu
            onPressAction={onPressMaxBuyAction}
            groups={maxBuyMenuGroups}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              height: 50,
              paddingLeft: 16,
              paddingRight: 16
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-end'
              }}>
              <Text
                variant="body1"
                sx={{
                  fontSize: 16,
                  lineHeight: 22,
                  color: theme.colors.$textSecondary
                }}>
                {formatMaxBuy(maxBuy)}
              </Text>
            </View>
          </DropdownMenu>
        </View>
      )
    }
  ]

  return (
    <GroupList
      data={limitData}
      titleSx={{
        fontSize: 16,
        lineHeight: 22,
        fontFamily: 'Inter-Regular'
      }}
    />
  )
}
