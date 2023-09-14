import AvaText from 'components/AvaText'
import Separator from 'components/Separator'
import { Space } from 'components/Space'
import React, { FC, useMemo } from 'react'
import { View } from 'react-native'
import {
  DeFiProtocolDetailTypes,
  DefiItem,
  DefiItemGroup,
  DefiLendingItem
} from 'services/defi/types'
import { DeFiPortfolioLending } from './DeFiPortfolioLending'

interface Props {
  group: DefiItemGroup
}

export const DeFiPortfolioItemGroup: FC<Props> = ({ group }) => {
  const itemsByType = useMemo(
    () =>
      group.items.reduce((grouped, item) => {
        if (!grouped[item.type]) {
          grouped[item.type] = [item]
        } else {
          grouped[item.type].push(item)
        }
        return grouped
      }, {} as Record<DeFiProtocolDetailTypes, DefiItem[]>),
    [group]
  )

  return (
    <View>
      <Separator style={{ marginTop: 16 }} />
      <Space y={16} />
      <AvaText.Heading6>{group.name}</AvaText.Heading6>
      {Object.entries(itemsByType).map(([type, items]) => {
        return renderGroupItem(type as DeFiProtocolDetailTypes, items)
      })}
    </View>
  )
}

const renderGroupItem = (type: DeFiProtocolDetailTypes, items: DefiItem[]) => {
  switch (type) {
    case DeFiProtocolDetailTypes.LENDING:
      return (
        <DeFiPortfolioLending key={type} items={items as DefiLendingItem[]} />
      )
    default:
      return null
  }
}
