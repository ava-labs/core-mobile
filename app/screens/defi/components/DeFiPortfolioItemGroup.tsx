import AvaText from 'components/AvaText'
import Separator from 'components/Separator'
import { Space } from 'components/Space'
import React, { FC, useMemo } from 'react'
import { View } from 'react-native'
import {
  DeFiProtocolDetailTypes,
  DeFiCommonItem
  DefiInsuranceBuyerItem,
  DefiItem,
  DefiItemGroup,
  DefiLendingItem,
  DefiPerpetualItem
} from 'services/defi/types'
import { DeFiPortfolioLending } from './DeFiPortfolioLending'
import { DeFiPortfolioInsurance } from './DeFiPortfolioInsurance'
import { DeFiPortfolioPerpetual } from './DeFiPortfolioPerpetual'
import { DeFiPortfolioCommon } from './DeFiPortfolioCommon'

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
    <View>
      <Separator style={{ marginTop: 16 }} />
      <Space y={16} />
      <AvaText.Heading6>{group.name}</AvaText.Heading6>
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

const renderGroupItem = ({ type, items, header }: GroupItemProps) => {
  switch (type) {
    case DeFiProtocolDetailTypes.LENDING:
      return (
        <DeFiPortfolioLending key={type} items={items as DeFiLendingItem[]} />
      )
    case DeFiProtocolDetailTypes.INSURANCE_BUYER:
      return (
        <DeFiPortfolioInsurance
          key={type}
          items={items as DefiInsuranceBuyerItem[]}
        />
      )
    case DeFiProtocolDetailTypes.PERPETUALS:
      return (
        <DeFiPortfolioPerpetual
          key={type}
          items={items as DefiPerpetualItem[]}
        />
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
