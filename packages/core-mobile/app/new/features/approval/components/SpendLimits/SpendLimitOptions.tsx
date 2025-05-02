import { bigToBigInt } from '@avalabs/core-utils-sdk'
import { Icons, Text, View, alpha, useTheme } from '@avalabs/k2-alpine'
import { TokenType } from '@avalabs/vm-module-types'
import Big from 'big.js'
import { showAlertWithTextInput } from 'common/utils/alertWithTextInput'
import { Limit, SpendLimit } from 'hooks/useSpendLimits'
import { DropdownGroup, DropdownMenu } from 'new/common/components/DropdownMenu'
import React, { useCallback, useMemo, useState } from 'react'
import { MenuId } from './types'
import {
  getDefaultSpendLimitValue,
  getSpendLimitValueBasedOnCurrentLimitType,
  sanitizeAmountInput
} from './utils'

export const SpendLimitOptions = ({
  spendLimit,
  menuItems,
  onSelect
}: {
  spendLimit: SpendLimit
  menuItems: DropdownGroup[]
  onSelect?: (spendLimit: SpendLimit) => void
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const [customSpendLimit, setCustomSpendLimit] = useState<SpendLimit>({
    ...spendLimit
  })

  const token = spendLimit.tokenApproval.token

  const displayValue = useMemo(() => {
    return getSpendLimitValueBasedOnCurrentLimitType(customSpendLimit)
  }, [customSpendLimit])

  const defaultSpendLimitValue = useMemo(() => {
    return getDefaultSpendLimitValue(spendLimit)
  }, [spendLimit])

  const sharedValueStyle = {
    fontSize: 16,
    lineHeight: 22,
    color: alpha(colors.$textPrimary, 0.6)
  }

  const onPressAction = useCallback(
    ({ nativeEvent }: { nativeEvent: { event: string } }) => {
      switch (nativeEvent.event) {
        case MenuId.DEFAULT: {
          const updatedSpendLimit = {
            ...customSpendLimit,
            limitType: Limit.DEFAULT
          }
          setCustomSpendLimit(updatedSpendLimit)
          onSelect?.(updatedSpendLimit)
          break
        }
        case MenuId.UNLIMITED: {
          const updatedSpendLimit = {
            ...customSpendLimit,
            limitType: Limit.UNLIMITED
          }
          setCustomSpendLimit(updatedSpendLimit)
          onSelect?.(updatedSpendLimit)
          break
        }
        case MenuId.CUSTOM: {
          showAlertWithTextInput({
            title: 'Define a custom spend limit',
            inputs: [
              {
                key: 'customSpendLimit',
                defaultValue: defaultSpendLimitValue,
                sanitize: ({ text }) => {
                  if (token.type === TokenType.ERC20) {
                    return sanitizeAmountInput(text, token.decimals)
                  }
                  return text
                }
              }
            ],
            buttons: [
              {
                text: 'Cancel',
                style: 'cancel'
              },
              {
                text: 'Save',
                shouldDisable: (values: Record<string, string>) => {
                  return values.customSpendLimit?.length === 0
                },
                onPress: (values: Record<string, string>) => {
                  const changedValue = values.customSpendLimit

                  if (
                    changedValue !== undefined &&
                    token.type === TokenType.ERC20
                  ) {
                    const valueToBn = bigToBigInt(
                      new Big(changedValue),
                      token.decimals
                    )

                    const updatedSpendLimit = {
                      ...customSpendLimit,
                      value: {
                        amount: changedValue,
                        bn: valueToBn
                      },
                      limitType: Limit.CUSTOM
                    }

                    setCustomSpendLimit(updatedSpendLimit)
                    onSelect?.(updatedSpendLimit)
                  }
                }
              }
            ]
          })
          break
        }
      }
    },
    [customSpendLimit, token, onSelect, defaultSpendLimitValue]
  )

  return (
    <DropdownMenu onPressAction={onPressAction} groups={menuItems}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center'
        }}>
        <Text
          variant="body1"
          numberOfLines={1}
          sx={{
            ...sharedValueStyle,
            flexGrow: 1,
            width: '70%',
            textAlign: 'right'
          }}>
          {displayValue}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text variant="body1" sx={sharedValueStyle}>
            {' ' + token.symbol}
          </Text>
          <Icons.Navigation.ChevronRight color={colors.$textSecondary} />
        </View>
      </View>
    </DropdownMenu>
  )
}
