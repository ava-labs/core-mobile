import { GroupList, Text, Toggle, View, useTheme } from '@avalabs/k2-alpine'
import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { selectIsFilterSmallUtxosAvailable } from 'store/posthog'
import {
  selectFilterSmallUtxos,
  setFilterSmallUtxos
} from 'store/settings/advanced/slice'

export const FilterSmallUtxos = (): React.JSX.Element => {
  const { theme } = useTheme()
  const dispatch = useDispatch()
  const flagOn = useSelector(selectIsFilterSmallUtxosAvailable)
  const isEnabled = useSelector(selectFilterSmallUtxos)

  const onToggle = useCallback(
    (value: boolean) => {
      dispatch(setFilterSmallUtxos(value))
      AnalyticsService.capture('FilterSmallUtxosToggled', { isEnabled: value })
    },
    [dispatch]
  )

  if (!flagOn) return <></>

  return (
    <View sx={{ gap: 4 }}>
      <GroupList
        data={[
          {
            title: 'Filter out small UTXOs',
            disableRowAccessibility: true,
            value: (
              <Toggle
                testID={
                  isEnabled
                    ? 'filter_small_utxos_enabled'
                    : 'filter_small_utxos_disabled'
                }
                value={isEnabled}
                onValueChange={onToggle}
              />
            )
          }
        ]}
        titleSx={{
          fontSize: 16,
          lineHeight: 22,
          fontFamily: 'Inter-Regular'
        }}
      />
      <Text
        variant="caption"
        sx={{
          fontFamily: 'Inter-Medium',
          color: theme.colors.$textSecondary,
          paddingRight: 32
        }}>
        Improves loading performance by removing UTXOs with a value less than
        0.002 AVAX from the wallet. Total balances may be inaccurate.
      </Text>
    </View>
  )
}
