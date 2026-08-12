import { View } from '@avalabs/k2-alpine'
import type { InfoOrderStatusWire, OpenOrder } from '@avalabs/perps-sdk'
import { ListRenderItem } from '@shopify/flash-list'
import { CollapsibleTabList } from 'common/components/CollapsibleTabList'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { ErrorState } from 'common/components/ErrorState'
import React, { useCallback, useMemo } from 'react'
import { ViewStyle } from 'react-native'
import { usePerpsAllOpenOrders } from '../hooks/usePerpsAllOpenOrders'
import { usePerpsPositionActions } from '../hooks/usePerpsPositionActions'
import { usePerpsPullToRefresh } from '../hooks/usePerpsPullToRefresh'
import { tickerOfCoin } from '../utils/coinDex'
import { toNumber } from '../utils/format'
import { OpenOrderListItem } from './OpenOrderListItem'

export type OpenOrderRow = {
  readonly id: string
  readonly coin: string
  readonly ticker: string
  readonly isLong: boolean
  readonly limitPx: number
  readonly sizeContracts: number
  readonly notionalUsd: number
  readonly oid: number
}

/**
 * Flatten the merged open-orders feed into display rows. TP/SL trigger legs
 * are dropped — they belong to their position's card, not the orders list.
 * HIP-3 minimal rows carry no trigger metadata and are always kept.
 */
export const toOpenOrderRows = (
  orders: readonly (InfoOrderStatusWire | OpenOrder)[]
): OpenOrderRow[] =>
  orders
    .filter(order => !('isTrigger' in order && order.isTrigger))
    .map(order => {
      const limitPx = toNumber(order.limitPx)
      const sizeContracts = toNumber(order.sz)
      return {
        id: `${order.coin}-${order.oid}`,
        coin: order.coin,
        ticker: tickerOfCoin(order.coin),
        isLong: order.side === 'B',
        limitPx,
        sizeContracts,
        notionalUsd: limitPx * sizeContracts,
        oid: order.oid
      }
    })

/** The "Open orders" tab of the My positions screen: resting limit orders
 * (live via WS) with a per-row Cancel. */
export const OpenOrdersList = ({
  containerStyle
}: {
  containerStyle?: ViewStyle
}): JSX.Element => {
  const { orders } = usePerpsAllOpenOrders()
  const { cancelOrder } = usePerpsPositionActions()
  // Pull-to-refresh: the nonce bump re-runs both open-orders REST fetches
  // (main dex + HIP-3) alongside the clearinghouse state.
  const { isRefreshing, onRefresh } = usePerpsPullToRefresh()

  const rows = useMemo(() => toOpenOrderRows(orders), [orders])

  // Each row shows its own in-flight spinner (see OpenOrderListItem), so the
  // shared `busy` flag is deliberately unused here — it would dim every
  // Cancel button while one cancel runs. Concurrent cancels are fine on HL.
  const handleCancel = useCallback(
    (item: OpenOrderRow): Promise<boolean> => cancelOrder(item.coin, item.oid),
    [cancelOrder]
  )

  const renderItem: ListRenderItem<OpenOrderRow> = useCallback(
    ({ item, index }) => (
      <OpenOrderListItem
        item={item}
        isFirst={index === 0}
        onCancel={handleCancel}
      />
    ),
    [handleCancel]
  )

  const keyExtractor = useCallback((item: OpenOrderRow) => item.id, [])

  const renderEmpty = useCallback(
    () => (
      <CollapsibleTabs.ContentWrapper>
        <ErrorState
          icon={undefined}
          title="No open orders"
          description="Limit orders that haven't filled yet will show up here"
        />
      </CollapsibleTabs.ContentWrapper>
    ),
    []
  )

  const renderHeader = useCallback(() => {
    return <View sx={{ height: 20 }} />
  }, [])

  return (
    <CollapsibleTabList
      data={rows}
      renderHeader={renderHeader}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      renderEmpty={renderEmpty}
      containerStyle={containerStyle}
      contentContainerStyle={containerStyle}
      isRefreshing={isRefreshing}
      onRefresh={onRefresh}
      listKey="open-orders"
    />
  )
}
