import { Limit, SpendLimit } from 'hooks/useSpendLimits'
import React, { useMemo } from 'react'
import { View, GroupList } from '@avalabs/k2-alpine'
import { DropdownMenuIcon } from 'new/common/components/DropdownMenuIcons'
import { DropdownGroup } from 'new/common/components/DropdownMenu'
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
