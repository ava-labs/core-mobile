import {
  PriceChangeIndicator,
  PriceChangeStatus,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import type { PerpUniverseEntry, PerpsAssetCtx } from '@avalabs/perps-sdk'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import React from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'

const DASH = '—'

const parseNum = (s: string | undefined): number | undefined => {
  if (s === undefined) return undefined
  const n = Number(s)
  return Number.isFinite(n) ? n : undefined
}

interface MarketDetailsHeaderProps {
  coin: string
  assetCtx?: PerpsAssetCtx
  universe?: PerpUniverseEntry
}

export const MarketDetailsHeader = ({
  coin,
  assetCtx,
  universe
}: MarketDetailsHeaderProps): JSX.Element => {
  const { theme } = useTheme()
  const { formatCurrency } = useFormatCurrency()

  const markPx = parseNum(assetCtx?.markPx)
  const prevDayPx = parseNum(assetCtx?.prevDayPx)

  const changePct =
    markPx !== undefined && prevDayPx !== undefined && prevDayPx !== 0
      ? ((markPx - prevDayPx) / prevDayPx) * 100
      : undefined

  const changeStatus =
    changePct === undefined
      ? PriceChangeStatus.Neutral
      : changePct > 0
      ? PriceChangeStatus.Up
      : changePct < 0
      ? PriceChangeStatus.Down
      : PriceChangeStatus.Neutral

  const formattedPrice =
    markPx !== undefined ? formatCurrency({ amount: markPx }) : DASH
  const formattedChangePct =
    changePct === undefined
      ? DASH
      : `${changePct > 0 ? '+' : ''}${changePct.toFixed(2)}%`
  const formattedLeverage =
    universe?.maxLeverage !== undefined ? `${universe.maxLeverage}×` : DASH

  return (
    <View
      sx={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        paddingTop: 8
      }}>
      <View sx={{ gap: 4 }}>
        <Text variant="heading2" sx={{ color: '$textSecondary' }}>
          {coin}
        </Text>
        {assetCtx === undefined ? (
          <ContentLoader
            speed={1}
            width={180}
            height={52}
            viewBox="0 0 180 52"
            backgroundColor={theme.isDark ? '#3E3E43' : '#F2F2F3'}
            foregroundColor={theme.isDark ? '#69696D' : '#D9D9D9'}>
            <Rect x="0" y="0" rx="6" ry="6" width="140" height="32" />
            <Rect x="0" y="38" rx="6" ry="6" width="90" height="14" />
          </ContentLoader>
        ) : (
          <>
            <Text variant="heading2">{formattedPrice}</Text>
            <PriceChangeIndicator
              status={changeStatus}
              formattedPercent={formattedChangePct}
            />
          </>
        )}
      </View>

      {universe?.maxLeverage === undefined ? (
        <ContentLoader
          speed={1}
          width={110}
          height={68}
          viewBox="0 0 110 68"
          backgroundColor={theme.isDark ? '#3E3E43' : '#F2F2F3'}
          foregroundColor={theme.isDark ? '#69696D' : '#D9D9D9'}>
          <Rect x="0" y="0" rx="12" ry="12" width="110" height="68" />
        </ContentLoader>
      ) : (
        <View
          sx={{
            borderWidth: 2,
            borderColor: theme.colors.$textSecondary,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 10,
            alignItems: 'center'
          }}>
          <Text variant="heading2" sx={{ color: '$textSecondary' }}>
            {formattedLeverage}
          </Text>
          <Text variant="caption" sx={{ color: '$textSecondary' }}>
            Leverage up to
          </Text>
        </View>
      )}
    </View>
  )
}
