import {
  alpha,
  Button,
  PriceChangeStatus,
  StatusArrow,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import type { InfoOrderStatusWire, OpenOrder } from '@avalabs/perps-sdk'
import { ListRenderItem } from '@shopify/flash-list'
import { CollapsibleTabList } from 'common/components/CollapsibleTabList'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { ErrorState } from 'common/components/ErrorState'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import React, { useCallback, useMemo } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { usePerpsAllOpenOrders } from '../hooks/usePerpsAllOpenOrders'
import { usePerpsPositionActions } from '../hooks/usePerpsPositionActions'
import { tickerOfCoin } from '../utils/coinDex'
import { toNumber } from '../utils/format'
import { PerpsCoinLogo } from './PerpsCoinLogo'

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
  containerStyle?: StyleProp<ViewStyle>
}): JSX.Element => {
  const { theme } = useTheme()
  const { formatCurrency } = useFormatCurrency()
  const { orders } = usePerpsAllOpenOrders()
  const { busy, cancelOrder } = usePerpsPositionActions()

  const rows = useMemo(() => toOpenOrderRows(orders), [orders])

  const renderItem: ListRenderItem<OpenOrderRow> = useCallback(
    ({ item, index }) => (
      <View
        sx={{
          paddingHorizontal: 16,
          marginTop: index === 0 ? 0 : 10
        }}>
        <View
          sx={{
            backgroundColor: '$surfaceSecondary',
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10
          }}>
          <PerpsCoinLogo size={36} symbol={item.coin} />
          <View sx={{ flex: 1 }}>
            <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text variant="buttonMedium">{item.ticker}</Text>
              <StatusArrow
                status={
                  item.isLong ? PriceChangeStatus.Up : PriceChangeStatus.Down
                }
                size={10}
              />
              <Text
                variant="buttonMedium"
                sx={{
                  color: item.isLong
                    ? theme.colors.$textSuccess
                    : theme.colors.$textDanger
                }}>
                {item.isLong ? 'Long' : 'Short'}
              </Text>
            </View>
            <Text
              variant="body2"
              sx={{ color: alpha(theme.colors.$textPrimary, 0.6) }}>
              {`${item.sizeContracts} @ ${formatCurrency({
                amount: item.limitPx
              })}`}
            </Text>
          </View>
          <View sx={{ alignItems: 'flex-end', gap: 6 }}>
            <Text variant="buttonMedium">
              {formatCurrency({ amount: item.notionalUsd })}
            </Text>
            <Button
              type="secondary"
              size="small"
              disabled={busy}
              onPress={() => cancelOrder(item.coin, item.oid)}
              testID={`open_order_cancel__${item.oid}`}>
              Cancel
            </Button>
          </View>
        </View>
      </View>
    ),
    [theme.colors, formatCurrency, busy, cancelOrder]
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

  return (
    <CollapsibleTabList
      data={rows}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      renderEmpty={renderEmpty}
      containerStyle={containerStyle}
      contentContainerStyle={containerStyle}
      listKey="open-orders"
    />
  )
}
