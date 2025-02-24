import React, { FC, useMemo } from 'react'
import {
  DeFiProtocolDetailTypes,
  DeFiInsuranceBuyerItem,
  DeFiCommonItem,
  DeFiItem,
  DeFiItemGroup,
  DeFiLendingItem,
  DeFiPerpetualItem,
  DeFiRewardItem,
  DeFiVestingItem
} from 'services/defi/types'
import { Text, View } from '@avalabs/k2-alpine'
import { DeFiPortfolioLending } from './DeFiPortfolioLending'
import { DeFiPortfolioInsuranceBuyer } from './DeFiPortfolioInsuranceBuyer'
import { DeFiPortfolioPerpetual } from './DeFiPortfolioPerpetual'
import { DeFiPortfolioCommon } from './DeFiPortfolioCommon'
import { DeFiPortfolioReward } from './DeFiPortfolioReward'
import { DeFiPortfolioVesting } from './DeFiPortfolioVesting'

interface Props {
  group: DeFiItemGroup
}

export const DeFiPortfolioItemGroup: FC<Props> = ({ group }) => {
  const header = group.name === 'Rewards' ? 'Pool' : 'Supplied'
  const itemsByType = useMemo(
    () =>
      group.items.reduce((grouped, item) => {
        if (!grouped[item.type]) {
          grouped[item.type] = [item]
        } else {
          grouped[item.type].push(item)
        }
        return grouped
      }, {} as Record<DeFiProtocolDetailTypes, DeFiItem[]>),
    [group]
  )

  return (
    <View sx={{ marginTop: 46 }}>
      <Text variant="heading3" sx={{ marginBottom: 10 }}>
        {group.name}
      </Text>
      {Object.entries(itemsByType).map(([type, items]) => {
        return renderGroupItem({
          type: type as DeFiProtocolDetailTypes,
          items,
          header
        })
      })}
    </View>
  )
}

interface GroupItemProps {
  type: DeFiProtocolDetailTypes
  header: string
  items: DeFiItem[]
}

const renderGroupItem = ({
  type,
  items,
  header
}: GroupItemProps): JSX.Element => {
  switch (type) {
    case DeFiProtocolDetailTypes.LENDING:
      return (
        <DeFiPortfolioLending key={type} items={items as DeFiLendingItem[]} />
      )
    case DeFiProtocolDetailTypes.INSURANCE_BUYER:
      return (
        <DeFiPortfolioInsuranceBuyer
          key={type}
          items={items as DeFiInsuranceBuyerItem[]}
        />
      )
    case DeFiProtocolDetailTypes.PERPETUALS:
      return (
        <DeFiPortfolioPerpetual
          key={type}
          items={items as DeFiPerpetualItem[]}
        />
      )
    case DeFiProtocolDetailTypes.VESTING:
      return (
        <DeFiPortfolioVesting key={type} items={items as DeFiVestingItem[]} />
      )
    case DeFiProtocolDetailTypes.REWARD:
      return (
        <DeFiPortfolioReward key={type} items={items as DeFiRewardItem[]} />
      )
    case DeFiProtocolDetailTypes.COMMON:
    default:
      return (
        <DeFiPortfolioCommon
          key={type}
          items={items as DeFiCommonItem[]}
          header={header}
        />
      )
  }
}
