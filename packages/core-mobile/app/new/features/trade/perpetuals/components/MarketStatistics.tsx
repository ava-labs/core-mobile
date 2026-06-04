import {
  GroupList,
  type GroupListItem,
  PriceChangeStatus,
  Text,
  useTheme
} from '@avalabs/k2-alpine'
import type { PerpsAssetCtx } from '@avalabs/perps-sdk'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import React from 'react'
import { Rect } from 'react-content-loader/native'
import { computePriceChange, formatChangeRow } from '../utils/priceChange'
import { Skeleton } from './Skeleton'

const parseNum = (s: string | undefined): number | undefined => {
  if (s === undefined) return undefined
  const n = Number(s)
  return Number.isFinite(n) ? n : undefined
}

const formatThousands = (n: number, fractionDigits = 2): string =>
  n.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  })

const ValueSkeleton = ({ width = 90 }: { width?: number }): JSX.Element => (
  <Skeleton width={width} height={20}>
    <Rect x="0" y="2" rx="6" ry="6" width={width} height="16" />
  </Skeleton>
)

interface MarketStatisticsProps {
  assetCtx?: PerpsAssetCtx
}

export const MarketStatistics = ({
  assetCtx
}: MarketStatisticsProps): JSX.Element => {
  const { theme } = useTheme()
  const { formatCurrency } = useFormatCurrency()

  const { delta, pct, status } = computePriceChange(assetCtx)
  const oraclePx = parseNum(assetCtx?.oraclePx)
  const openInterestNum = parseNum(assetCtx?.openInterest)
  const fundingNum = parseNum(assetCtx?.funding)

  const changeColor = colorForStatus(status, theme.colors)
  // Negative funding pays longs → green, positive → red.
  const fundingColor = colorForFunding(fundingNum, theme.colors)

  const muted = (text: string): JSX.Element => (
    <Text variant="body1" sx={{ color: '$textSecondary' }}>
      {text}
    </Text>
  )
  const colored = (text: string, color: string): JSX.Element => (
    <Text variant="body1" sx={{ color }}>
      {text}
    </Text>
  )

  const markPx = parseNum(assetCtx?.markPx)
  const mark =
    markPx !== undefined ? muted(formatCurrency({ amount: markPx })) : null
  const oracle =
    oraclePx !== undefined ? muted(formatCurrency({ amount: oraclePx })) : null
  const changeRow = formatChangeRow(delta, pct)
  const change =
    changeRow !== undefined ? colored(changeRow, changeColor) : null
  const volume =
    assetCtx?.dayNtlVlm !== undefined
      ? muted(formatCurrency({ amount: assetCtx.dayNtlVlm }))
      : null
  const openInterest =
    openInterestNum !== undefined
      ? muted(formatThousands(openInterestNum))
      : null
  // HL funding is a per-hour decimal (e.g. 0.0001 = 0.01%/hr).
  const funding =
    fundingNum !== undefined
      ? colored(
          `${fundingNum > 0 ? '+' : ''}${(fundingNum * 100).toFixed(4)}%`,
          fundingColor
        )
      : null

  const stats: GroupListItem[] = [
    { title: 'Mark', value: mark ?? <ValueSkeleton width={80} /> },
    { title: 'Oracle', value: oracle ?? <ValueSkeleton width={80} /> },
    { title: '24h change', value: change ?? <ValueSkeleton width={120} /> },
    { title: '24h volume', value: volume ?? <ValueSkeleton width={120} /> },
    {
      title: 'Open interest',
      value: openInterest ?? <ValueSkeleton width={110} />
    },
    { title: 'Funding', value: funding ?? <ValueSkeleton width={80} /> }
  ]

  return <GroupList data={stats} />
}

type ThemeColors = ReturnType<typeof useTheme>['theme']['colors']

const colorForStatus = (
  status: PriceChangeStatus,
  colors: ThemeColors
): string => {
  if (status === PriceChangeStatus.Up) return colors.$textSuccess
  if (status === PriceChangeStatus.Down) return colors.$textDanger
  return colors.$textPrimary
}

const colorForFunding = (
  funding: number | undefined,
  colors: ThemeColors
): string => {
  if (funding === undefined || funding === 0) return colors.$textPrimary
  return funding < 0 ? colors.$textSuccess : colors.$textDanger
}
