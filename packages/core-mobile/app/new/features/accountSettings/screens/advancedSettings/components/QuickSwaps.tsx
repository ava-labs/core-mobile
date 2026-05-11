import { GroupList, Text, Toggle, View, useTheme } from '@avalabs/k2-alpine'
import { useQuickSwaps } from 'features/swap/hooks/useQuickSwaps'
import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import {
  selectIsQuickSwapsEnabled,
  setQuickSwapsEnabled
} from 'store/settings/advanced/slice'
import { QuickSwapsFeePicker } from './QuickSwapsFeePicker'
import { QuickSwapsMaxBuy } from './QuickSwapsMaxBuy'

export const QuickSwaps = (): React.JSX.Element => {
  const { theme } = useTheme()
  const dispatch = useDispatch()

  const { walletAllowed, chainAllowed, isAvailable, flagOn } = useQuickSwaps()
  const isEnabled = useSelector(selectIsQuickSwapsEnabled)

  // Hardware wallets and non-EVM chains see the toggle but can't interact.
  // Settings persist across context switches — re-enabling on a software
  // wallet on an EVM chain restores prior toggle/tier/maxBuy choices.
  const disabledReason = !walletAllowed
    ? 'Quick swaps are not available on hardware wallets.'
    : !chainAllowed
    ? 'Quick swaps are only available on EVM networks.'
    : null
  const showConfig = isAvailable && isEnabled

  const onToggle = useCallback(
    (value: boolean) => {
      dispatch(setQuickSwapsEnabled(value))
      AnalyticsService.capture('QuickSwapsToggled', { isEnabled: value })
    },
    [dispatch]
  )

  if (!flagOn) return <></>

  return (
    <View sx={{ gap: 24 }}>
      <View sx={{ gap: 4 }}>
        <GroupList
          data={[
            {
              title: 'Quick swaps',
              value: (
                <Toggle
                  value={isEnabled}
                  onValueChange={onToggle}
                  disabled={!isAvailable}
                />
              )
            }
          ]}
          titleSx={{
            fontSize: 16,
            lineHeight: 22,
            fontFamily: 'Inter-Regular',
            opacity: isAvailable ? 1 : 0.5
          }}
        />
        <Text
          variant="caption"
          sx={{
            fontFamily: 'Inter-Medium',
            color: theme.colors.$textSecondary,
            paddingRight: 32
          }}>
          {disabledReason ??
            `Swap tokens inside of Core with one-click. Core is unable to provide free gas if this feature is enabled.`}
        </Text>
      </View>

      {showConfig && (
        <View sx={{ gap: 12 }}>
          <QuickSwapsFeePicker />
          <QuickSwapsMaxBuy />
        </View>
      )}
    </View>
  )
}
