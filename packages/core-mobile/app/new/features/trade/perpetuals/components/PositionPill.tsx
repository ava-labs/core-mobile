import { Icons, Text, useTheme, View } from '@avalabs/k2-alpine'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import React from 'react'
import type { OrderSide } from '../contexts/PlaceOrderContext'
import { dexOfCoin, tickerOfCoin } from '../utils/coinDex'
import { DexBadge } from './DexBadge'
import { PerpsCoinLogo } from './PerpsCoinLogo'

interface PositionPillProps {
  coin: string
  price: number
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
        <PerpsCoinLogo size={27} symbol={coin} />
        <Text variant="body1" sx={{ color: '$textPrimary' }}>
          {tickerOfCoin(coin)}
        </Text>
        <DexBadge dex={dexOfCoin(coin)} />
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
