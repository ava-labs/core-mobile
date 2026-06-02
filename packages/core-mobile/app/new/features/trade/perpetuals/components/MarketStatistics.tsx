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
import ContentLoader, { Rect } from 'react-content-loader/native'

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

const ValueSkeleton = ({ width = 90 }: { width?: number }): JSX.Element => {
  const { theme } = useTheme()
  return (
    <ContentLoader
      speed={1}
      width={width}
      height={20}
      viewBox={`0 0 ${width} 20`}
      backgroundColor={theme.isDark ? '#3E3E43' : '#F2F2F3'}
      foregroundColor={theme.isDark ? '#69696D' : '#D9D9D9'}>
      <Rect x="0" y="2" rx="6" ry="6" width={width} height="16" />
    </ContentLoader>
  )
}

interface MarketStatisticsProps {
  assetCtx?: PerpsAssetCtx
}

export const MarketStatistics = ({
  assetCtx
}: MarketStatisticsProps): JSX.Element => {
  const { theme } = useTheme()
  const { formatCurrency } = useFormatCurrency()

  const markPx = parseNum(assetCtx?.markPx)
  const oraclePx = parseNum(assetCtx?.oraclePx)
  const prevDayPx = parseNum(assetCtx?.prevDayPx)
  const openInterestNum = parseNum(assetCtx?.openInterest)
  const fundingNum = parseNum(assetCtx?.funding)

  const changeDelta =
    markPx !== undefined && prevDayPx !== undefined
      ? markPx - prevDayPx
      : undefined
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

  const changeColor =
    changeStatus === PriceChangeStatus.Up
      ? theme.colors.$textSuccess
      : changeStatus === PriceChangeStatus.Down
      ? theme.colors.$textDanger
      : theme.colors.$textPrimary

  // Negative funding pays longs → green, positive → red.
  const fundingColor =
    fundingNum === undefined || fundingNum === 0
      ? theme.colors.$textPrimary
      : fundingNum < 0
      ? theme.colors.$textSuccess
      : theme.colors.$textDanger

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

  const mark =
    markPx !== undefined ? muted(formatCurrency({ amount: markPx })) : null
  const oracle =
    oraclePx !== undefined ? muted(formatCurrency({ amount: oraclePx })) : null
  const change =
    changeDelta !== undefined && changePct !== undefined
      ? colored(
          `${changeDelta > 0 ? '+' : ''}${changeDelta.toFixed(2)} / ${
            changePct > 0 ? '+' : ''
          }${changePct.toFixed(2)}%`,
          changeColor
        )
      : null
  const volume =
    assetCtx?.dayNtlVlm !== undefined
      ? muted(formatCurrency({ amount: assetCtx.dayNtlVlm }))
      : null
  const openInterest =
    openInterestNum !== undefined ? muted(formatThousands(openInterestNum)) : null
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
