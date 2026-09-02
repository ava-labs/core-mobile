import { Icons, Text, useTheme, View } from '@avalabs/k2-alpine'
import {
  type DropdownGroup,
  DropdownMenu
} from 'common/components/DropdownMenu'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import React, { useCallback, useMemo } from 'react'
import type { OrderSide } from '../contexts/PlaceOrderContext'
import { dexOfCoin, tickerOfCoin } from '../utils/coinDex'
import { DexBadge } from './DexBadge'
import { PerpsCoinLogo } from './PerpsCoinLogo'

interface PositionPillProps {
  coin: string
  price: number
  side?: OrderSide
  /**
   * When set, the side label becomes a native select (dropdown) offering
   * Long/Short. Only the open-order flow passes this — Trigger/Close render
   * the pill read-only.
   */
  onChangeSide?: (side: OrderSide) => void
}

export const PositionPill = ({
  coin,
  price,
  side,
  onChangeSide
}: PositionPillProps): JSX.Element => {
  const { theme } = useTheme()
  const { formatCurrency } = useFormatCurrency()

  const isLong = side === 'long'

  const sideGroups = useMemo<DropdownGroup[]>(
    () => [
      {
        key: 'perp-order-side',
        items: [
          { id: 'long', title: 'Long', selected: isLong },
          { id: 'short', title: 'Short', selected: !isLong }
        ]
      }
    ],
    [isLong]
  )

  const handleSideAction = useCallback(
    ({ nativeEvent: { event } }: { nativeEvent: { event: string } }) => {
      if (event === 'long' || event === 'short') {
        onChangeSide?.(event)
      }
    },
    [onChangeSide]
  )

  const sideLabel = side !== undefined && (
    <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Text variant="heading3">{isLong ? 'Long' : 'Short'}</Text>
      {isLong ? (
        <Icons.Custom.TrendingArrowUp
          width={18}
          height={16}
          color={theme.colors.$textSuccess}
        />
      ) : (
        <Icons.Custom.TrendingArrowDown
          width={18}
          height={16}
          color={theme.colors.$textDanger}
        />
      )}
      {onChangeSide !== undefined && (
        <Icons.Navigation.ExpandMore
          width={20}
          height={20}
          color={theme.colors.$textSecondary}
        />
      )}
    </View>
  )

  return (
    <View
      sx={{
        backgroundColor: '$surfaceSecondary',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: 4
      }}>
      <View
        sx={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          padding: 16
        }}>
        <PerpsCoinLogo size={27} symbol={coin} />
        <Text variant="body1" sx={{ color: '$textPrimary' }}>
          {tickerOfCoin(coin)}
        </Text>
        <DexBadge dex={dexOfCoin(coin)} />
        <Text variant="body1" sx={{ color: '$textSecondary' }}>
          {formatCurrency({ amount: price })}
        </Text>
      </View>
      {onChangeSide !== undefined && side !== undefined ? (
        <DropdownMenu
          groups={sideGroups}
          style={{
            padding: 16
          }}
          onPressAction={handleSideAction}
          testID="perpetuals_place_order_side_select">
          {sideLabel}
        </DropdownMenu>
      ) : (
        <View sx={{ padding: 16 }}>{sideLabel}</View>
      )}
    </View>
  )
}
