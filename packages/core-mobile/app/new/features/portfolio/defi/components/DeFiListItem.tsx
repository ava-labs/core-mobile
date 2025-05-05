import React from 'react'
import { DeFiChain, DeFiSimpleProtocol } from 'services/defi/types'
import { DeFiGridView } from './DeFiGridView'
import { DeFiListView } from './DeFiListView'

export const DeFiListItem = ({
  item,
  chain,
  index,
  isGridView,
  formattedPrice,
  onPress,
  onPressArrow
}: {
  item: DeFiSimpleProtocol
  chain: DeFiChain | undefined
  index: number
  formattedPrice: string
  isGridView?: boolean
  onPress: () => void
  onPressArrow: () => void
}): React.JSX.Element => {
  return isGridView ? (
    <DeFiGridView
      item={item}
      chain={chain}
      index={index}
      formattedPrice={formattedPrice}
      onPress={onPress}
      onPressArrow={onPressArrow}
    />
  ) : (
    <DeFiListView
      item={item}
      chain={chain}
      formattedPrice={formattedPrice}
      onPress={onPress}
      onPressArrow={onPressArrow}
    />
  )
}
