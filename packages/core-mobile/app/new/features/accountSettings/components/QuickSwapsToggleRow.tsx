import React, { useCallback } from 'react'
import { Text, Toggle, View, useTheme } from '@avalabs/k2-alpine'
import { Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectIsQuickSwapsEnabled,
  selectQuickSwapsFeeSetting,
  selectQuickSwapsMaxBuy,
  setQuickSwapsEnabled,
  setQuickSwapsFeeSetting
} from 'store/settings/advanced/slice'
import { selectSelectedCurrency } from 'store/settings/currency'
import { QuickSwapFeeLevel } from 'store/settings/advanced/types'

const TIER_LABEL: Record<QuickSwapFeeLevel, string> = {
  low: 'Slow',
  medium: 'Normal',
  high: 'Fast'
}
const TIER_ORDER: QuickSwapFeeLevel[] = ['low', 'medium', 'high']

const MAX_BUY_LABELS: Record<string, string> = {
  unlimited: 'Unlimited',
  '1000': '1,000',
  '5000': '5,000',
  '10000': '10,000',
  '50000': '50,000'
}

export const QuickSwapsToggleRow = ({
  testID
}: {
  testID?: string
}): React.JSX.Element => {
  const { theme } = useTheme()
  const dispatch = useDispatch()
  const router = useRouter()

  const isEnabled = useSelector(selectIsQuickSwapsEnabled)
  const feeSetting = useSelector(selectQuickSwapsFeeSetting)
  const maxBuy = useSelector(selectQuickSwapsMaxBuy)
  const currencyCode = useSelector(selectSelectedCurrency)

  const onToggle = useCallback(
    (value: boolean) => {
      dispatch(setQuickSwapsEnabled(value))
    },
    [dispatch]
  )

  const goToAmountLimit = useCallback(
    () => router.navigate('/accountSettings/swapAmountLimit'),
    [router]
  )

  const limitLabel =
    maxBuy === 'unlimited'
      ? MAX_BUY_LABELS.unlimited
      : `${MAX_BUY_LABELS[maxBuy]} ${currencyCode}`

  // When selected pill background is $textPrimary (dark on light / white on dark),
  // text needs to be the inverse: white on dark mode, near-black on light mode.
  const selectedPillTextColor = theme.isDark ? '#28282E' : '#FFFFFF'

  return (
    <View testID={testID} sx={{ marginBottom: 16 }}>
      {/* main row */}
      <View
        sx={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderRadius: 12,
          backgroundColor: theme.colors.$surfaceSecondary
        }}>
        <View sx={{ flex: 1, paddingRight: 12 }}>
          <Text variant="body1" sx={{ color: theme.colors.$textPrimary }}>
            Quick swaps
          </Text>
        </View>
        <Toggle
          testID="quick-swaps-toggle-switch"
          value={isEnabled}
          onValueChange={onToggle}
        />
      </View>

      <Text
        variant="subtitle2"
        sx={{
          marginTop: 8,
          color: theme.colors.$textSecondary,
          paddingHorizontal: 4
        }}>
        Swap tokens inside of Core with one-click. Core is unable to provide
        free gas if this feature is enabled.
      </Text>

      {isEnabled && (
        <View>
          <View
            testID="quick-swaps-fee-picker"
            sx={{
              marginTop: 16,
              padding: 12,
              borderRadius: 12,
              backgroundColor: theme.colors.$surfaceSecondary
            }}>
            <Text variant="body2" sx={{ marginBottom: 8 }}>
              Network fee settings
            </Text>
            <View sx={{ flexDirection: 'row', gap: 8 }}>
              {TIER_ORDER.map(level => {
                const selected = feeSetting === level
                return (
                  <Pressable
                    key={level}
                    onPress={() => dispatch(setQuickSwapsFeeSetting(level))}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 8,
                      backgroundColor: selected
                        ? theme.colors.$textPrimary
                        : theme.colors.$surfacePrimary,
                      alignItems: 'center'
                    }}>
                    <Text
                      sx={{
                        color: selected
                          ? selectedPillTextColor
                          : theme.colors.$textPrimary
                      }}>
                      {TIER_LABEL[level]}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
            <Text
              variant="subtitle2"
              sx={{ marginTop: 8, color: theme.colors.$textSecondary }}>
              Set the default fee for quick swaps. Faster swaps require higher
              fees.
            </Text>
          </View>

          <Pressable
            testID="quick-swaps-amount-limit-row"
            onPress={goToAmountLimit}
            style={{
              marginTop: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderRadius: 12,
              backgroundColor: theme.colors.$surfaceSecondary,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
            <Text variant="body1">Swap amount limit</Text>
            <Text
              variant="body1"
              sx={{ color: theme.colors.$textSecondary }}>
              {limitLabel}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}
