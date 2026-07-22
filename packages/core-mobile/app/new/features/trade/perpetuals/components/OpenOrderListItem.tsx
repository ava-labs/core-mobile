import {
  alpha,
  Button,
  PriceChangeStatus,
  StatusArrow,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import React from 'react'
import { PerpsCoinLogo } from './PerpsCoinLogo'
import type { OpenOrderRow } from './OpenOrdersList'

interface OpenOrderListItemProps {
  item: OpenOrderRow
  isFirst?: boolean
  /**
   * Whether this row's cancel is in flight. Held by the parent keyed by order
   * id (NOT local state) — FlashList recycles cells, so state living inside
   * the item component can leak onto a different order after a recycle.
   */
  cancelling: boolean
  onCancel: (item: OpenOrderRow) => void
}

/** One resting open order: coin, side, size @ limit price, notional, Cancel. */
export const OpenOrderListItem = ({
  item,
  isFirst,
  cancelling,
  onCancel
}: OpenOrderListItemProps): JSX.Element => {
  const { theme } = useTheme()
  const { formatCurrency } = useFormatCurrency()

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
          <Button
            type="secondary"
            size="small"
            disabled={cancelling}
            onPress={() => onCancel(item)}
            testID={`open_order_cancel__${item.oid}`}>
            Cancel
          </Button>
        </View>
      </View>
    </View>
  )
}
