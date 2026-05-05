import React, { useCallback } from 'react'
import { Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useDispatch, useSelector } from 'react-redux'
import { Text, View, useTheme } from '@avalabs/k2-alpine'
import {
  selectQuickSwapsMaxBuy,
  setQuickSwapsMaxBuy
} from 'store/settings/advanced/slice'
import { selectSelectedCurrency } from 'store/settings/currency'
import {
  QUICK_SWAP_MAX_BUY_VALUES,
  QuickSwapMaxBuy
} from 'store/settings/advanced/types'

const FORMAT: Record<QuickSwapMaxBuy, string> = {
  unlimited: 'Unlimited',
  '1000': '1,000',
  '5000': '5,000',
  '10000': '10,000',
  '50000': '50,000'
}

export const SwapAmountLimitScreen = (): React.JSX.Element => {
  const { theme } = useTheme()
  const router = useRouter()
  const dispatch = useDispatch()
  const current = useSelector(selectQuickSwapsMaxBuy)
  const currencyCode = useSelector(selectSelectedCurrency)

  const select = useCallback(
    (value: QuickSwapMaxBuy) => {
      dispatch(setQuickSwapsMaxBuy(value))
      router.back()
    },
    [dispatch, router]
  )

  return (
    <View
      sx={{
        flex: 1,
        backgroundColor: theme.colors.$surfacePrimary,
        paddingHorizontal: 16,
        paddingTop: 16
      }}>
      <Text variant="heading3" sx={{ marginBottom: 16 }}>
        Swap amount limit
      </Text>
      {QUICK_SWAP_MAX_BUY_VALUES.map(value => {
        const selected = current === value
        return (
          <Pressable
            key={value}
            testID={
              selected
                ? `amount-limit-row-${value}-selected`
                : `amount-limit-row-${value}`
            }
            onPress={() => select(value)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderRadius: 12,
              marginBottom: 8,
              backgroundColor: theme.colors.$surfaceSecondary,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
            <Text variant="body1">{FORMAT[value]}</Text>
            <Text
              variant="body2"
              sx={{
                color: selected
                  ? theme.colors.$textPrimary
                  : theme.colors.$textSecondary
              }}>
              {selected ? '✓' : value === 'unlimited' ? '' : currencyCode}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
