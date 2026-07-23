import {
  ActivityIndicator,
  alpha,
  Button,
  PriceChangeStatus,
  StatusArrow,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import React, { useRef, useState } from 'react'
import { PerpsCoinLogo } from './PerpsCoinLogo'
import type { OpenOrderRow } from './OpenOrdersList'

interface OpenOrderListItemProps {
  item: OpenOrderRow
  isFirst?: boolean
  /** Performs the cancel; resolves when the exchange call settles. */
  onCancel: (item: OpenOrderRow) => Promise<boolean>
}

/**
 * One resting open order: coin, side, size @ limit price, notional, Cancel.
 * The in-flight cancel state is local — the Cancel button swaps to a spinner
 * for this row only, so other rows stay untouched while one cancel runs.
 */
export const OpenOrderListItem = ({
  item,
  isFirst,
  onCancel
}: OpenOrderListItemProps): JSX.Element => {
  const { theme } = useTheme()
  const { formatCurrency } = useFormatCurrency()

  const [cancelling, setCancelling] = useState(false)
  // FlashList recycles cells: this instance can be handed a different order
  // mid-flight. Reset the transient state during render (so the wrong row
  // never paints a spinner) and track the shown id so a stale promise can't
  // flip state for an order this cell no longer displays.
  const [renderedId, setRenderedId] = useState(item.id)
  if (renderedId !== item.id) {
    setRenderedId(item.id)
    setCancelling(false)
  }
  const shownIdRef = useRef(item.id)
  shownIdRef.current = item.id

  const handleCancel = async (): Promise<void> => {
    if (cancelling) {
      return
    }
    const cancellingId = item.id
    setCancelling(true)
    try {
      await onCancel(item)
    } finally {
      if (shownIdRef.current === cancellingId) {
        setCancelling(false)
      }
    }
  }

  return (
    <View
      sx={{
        paddingHorizontal: 16,
        marginTop: isFirst ? 0 : 10
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
          {cancelling ? (
            <View
              sx={{ height: 28, justifyContent: 'center' }}
              testID={`open_order_cancelling__${item.oid}`}>
              <ActivityIndicator size="small" />
            </View>
          ) : (
            <Button
              type="secondary"
              size="small"
              onPress={handleCancel}
              testID={`open_order_cancel__${item.oid}`}>
              Cancel
            </Button>
          )}
        </View>
      </View>
    </View>
  )
}
