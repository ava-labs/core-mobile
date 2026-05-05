import {
  Button,
  GroupList,
  Icons,
  Text,
  Toggle,
  View,
  useInversedTheme,
  useTheme
} from '@avalabs/k2-alpine'
import { DropdownGroup, DropdownMenu } from 'new/common/components/DropdownMenu'
import { DropdownMenuIcon } from 'new/common/components/DropdownMenuIcons'
import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectIsQuickSwapsEnabled,
  selectQuickSwapsFeeSetting,
  selectQuickSwapsMaxBuy,
  setQuickSwapsEnabled,
  setQuickSwapsFeeSetting,
  setQuickSwapsMaxBuy
} from 'store/settings/advanced/slice'
import {
  QUICK_SWAP_MAX_BUY_VALUES,
  QuickSwapFeeLevel,
  QuickSwapMaxBuy
} from 'store/settings/advanced/types'
import { selectSelectedCurrency } from 'store/settings/currency'

const TIER_LABEL: Record<QuickSwapFeeLevel, string> = {
  low: 'Slow',
  medium: 'Normal',
  high: 'Fast'
}
const TIER_ORDER: QuickSwapFeeLevel[] = ['low', 'medium', 'high']

const MAX_BUY_LABELS: Record<QuickSwapMaxBuy, string> = {
  unlimited: 'Unlimited',
  '1000': '1,000',
  '5000': '5,000',
  '10000': '10,000',
  '50000': '50,000'
}

const formatMaxBuyLabel = (
  value: QuickSwapMaxBuy,
  currencyCode: string
): string =>
  value === 'unlimited'
    ? MAX_BUY_LABELS.unlimited
    : `${MAX_BUY_LABELS[value]} ${currencyCode}`

export const QuickSwapsToggleRow = ({
  testID
}: {
  testID?: string
}): React.JSX.Element => {
  const { theme } = useTheme()
  const dispatch = useDispatch()

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

  const maxBuyMenuGroups: DropdownGroup[] = [
    {
      id: 'quick-swaps-max-buy',
      items: QUICK_SWAP_MAX_BUY_VALUES.map(value => ({
        id: value,
        title: formatMaxBuyLabel(value, currencyCode),
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

  const {
    theme: { colors: inversedColors }
  } = useInversedTheme({ isDark: theme.isDark })

  return (
    <View testID={testID} sx={{ gap: 24 }}>
      <View sx={{ gap: 4 }}>
        <GroupList
          data={[
            {
              title: 'Quick swaps',
              value: (
                <Toggle
                  testID="quick-swaps-toggle-switch"
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
          separatorMarginRight={16}
        />
        <Text
          variant="caption"
          sx={{
            fontFamily: 'Inter-Medium',
            color: theme.colors.$textSecondary,
            paddingRight: 32
          }}>
          {`Swap tokens inside of Core with one-click. Core is unable to provide free gas if this feature is enabled.`}
        </Text>
      </View>

      {isEnabled && (
        <View sx={{ gap: 12 }}>
          <View sx={{ gap: 4 }}>
            <View
              testID="quick-swaps-fee-picker"
              sx={{
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: theme.colors.$surfaceSecondary,
                gap: 10
              }}>
              <Text variant="body2" sx={{ fontSize: 16, lineHeight: 22 }}>
                Network fee settings
              </Text>
              <View sx={{ flexDirection: 'row', gap: 12 }}>
                {TIER_ORDER.map(level => {
                  const isSelected = feeSetting === level
                  return (
                    <Button
                      type={isSelected ? 'primary' : 'secondary'}
                      key={level}
                      size="large"
                      onPress={() => dispatch(setQuickSwapsFeeSetting(level))}
                      style={{
                        flex: 1,
                        borderRadius: 10,
                        alignItems: 'center'
                      }}>
                      <Text
                        sx={{
                          fontFamily: 'Inter-Medium',
                          color: isSelected
                            ? inversedColors.$textPrimary
                            : theme.colors.$textPrimary,
                          fontSize: 15,
                          lineHeight: 20,
                          textAlign: 'center'
                        }}>
                        {TIER_LABEL[level]}
                      </Text>
                    </Button>
                  )
                })}
              </View>
            </View>
            <Text
              variant="caption"
              sx={{
                fontFamily: 'Inter-Medium',
                color: theme.colors.$textSecondary,
                paddingRight: 32
              }}>
              {`Set the default fee for quick swaps. Faster swaps require higher fees.`}
            </Text>
          </View>

          <GroupList
            testID="quick-swaps-amount-limit-row"
            data={[
              {
                title: 'Swap amount limit',
                value: (
                  <DropdownMenu
                    onPressAction={onPressMaxBuyAction}
                    groups={maxBuyMenuGroups}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      height: 42
                    }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'flex-end'
                      }}>
                      <Text
                        variant="body1"
                        numberOfLines={1}
                        sx={{
                          fontSize: 16,
                          lineHeight: 22,
                          color: theme.colors.$textSecondary,
                          marginRight: 16
                        }}>
                        {formatMaxBuyLabel(maxBuy, currencyCode)}
                      </Text>
                      <Icons.Navigation.ChevronRight
                        color={theme.colors.$textSecondary}
                        style={{ position: 'absolute', right: -8 }}
                      />
                    </View>
                  </DropdownMenu>
                )
              }
            ]}
            titleSx={{
              fontSize: 16,
              lineHeight: 22,
              fontFamily: 'Inter-Regular'
            }}
          />
        </View>
      )}
    </View>
  )
}
