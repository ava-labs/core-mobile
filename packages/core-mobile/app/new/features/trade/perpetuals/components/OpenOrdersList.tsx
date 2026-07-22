import { View } from '@avalabs/k2-alpine'
import type { InfoOrderStatusWire, OpenOrder } from '@avalabs/perps-sdk'
import { ListRenderItem } from '@shopify/flash-list'
import { CollapsibleTabList } from 'common/components/CollapsibleTabList'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { ErrorState } from 'common/components/ErrorState'
import React, { useCallback, useMemo, useState } from 'react'
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

  // Track cancellation per row, not via the shared `busy` flag — disabling
  // every Cancel while one is in flight dims them all (disabled renders at
  // 0.3 opacity), which reads as every button having been pressed. Different
  // orders may cancel concurrently; only a re-tap of the same row is blocked.
  const [cancellingIds, setCancellingIds] = useState<ReadonlySet<string>>(
    () => new Set()
  )
  const handleCancel = useCallback(
    async (item: OpenOrderRow): Promise<void> => {
      if (cancellingIds.has(item.id)) {
        return
      }
      setCancellingIds(prev => new Set(prev).add(item.id))
      try {
        await cancelOrder(item.coin, item.oid)
      } finally {
        setCancellingIds(prev => {
          const next = new Set(prev)
          next.delete(item.id)
          return next
        })
      }
    },
    [cancellingIds, cancelOrder]
  )

  const renderItem: ListRenderItem<OpenOrderRow> = useCallback(
    ({ item, index }) => (
      <OpenOrderListItem
        item={item}
        isFirst={index === 0}
        cancelling={cancellingIds.has(item.id)}
        onCancel={handleCancel}
      />
    ),
    [cancellingIds, handleCancel]
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
      extraData={{ cancellingIds }}
    />
  )
}
