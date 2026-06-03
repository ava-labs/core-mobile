import { Icons, Text, useTheme, View } from '@avalabs/k2-alpine'
import { TokenLogo } from 'common/components/TokenLogo'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import React from 'react'
import type { OrderSide } from '../contexts/PlaceOrderContext'

interface PositionPillProps {
  coin: string
  price: number
  /** When set, renders the "Long ▲" / "Short ▼" direction on the right. */
  side?: OrderSide
}

export const PositionPill = ({
  coin,
  price,
  side
}: PositionPillProps): JSX.Element => {
  const { theme } = useTheme()
  const { formatCurrency } = useFormatCurrency()

  const isLong = side === 'long'

  return (
    <View
      sx={{
        backgroundColor: '$surfaceSecondary',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: 4
      }}>
      <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TokenLogo size={27} symbol={coin} />
        <Text variant="body1" sx={{ color: '$textPrimary' }}>
          {coin}
        </Text>
        <Text variant="body1" sx={{ color: '$textSecondary' }}>
          {formatCurrency({ amount: price })}
        </Text>
      </View>
      {side !== undefined && (
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
        </View>
      )}
    </View>
  )
}
