import { SpendLimit } from 'hooks/useSpendLimits'
import React, { useMemo } from 'react'
import { View, GroupList } from '@avalabs/k2-alpine'
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
  const data = useMemo(() => {
    return spendLimits.map((spendLimit, index) => {
      const defaultSpendLimitValue = getDefaultSpendLimitValue(spendLimit)
      const token = spendLimit.tokenApproval.token

      const menuItems = [
        {
          id: 'spendLimitItems',
          items: [
            {
              id: MenuId.DEFAULT,
              title: `${defaultSpendLimitValue} ${token.symbol} - Default`
            },
            {
              id: MenuId.UNLIMITED,
              title: 'Unlimited'
            },
            {
              id: MenuId.CUSTOM,
              title: 'Custom'
            }
          ]
        }
      ]

      return {
        title: 'Spend limit',
        value: (
          <SpendLimitOptions
            spendLimit={spendLimit}
            menuItems={menuItems}
            onSelect={onSelect}
            key={index}
          />
        )
      }
    })
  }, [spendLimits, onSelect])

  return (
    <View style={{ marginTop: 12 }}>
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
