import React from 'react'
import { ViewStyle } from 'react-native'
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
  onPressArrow,
  style
}: {
  item: DeFiSimpleProtocol
  chain: DeFiChain | undefined
  index: number
  formattedPrice: string
  isGridView?: boolean
  onPress: () => void
  onPressArrow: () => void
  style: ViewStyle
}): React.JSX.Element => {
  return isGridView ? (
    <DeFiGridView
      item={item}
      chain={chain}
      index={index}
      formattedPrice={formattedPrice}
      onPress={onPress}
      onPressArrow={onPressArrow}
      style={style}
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
