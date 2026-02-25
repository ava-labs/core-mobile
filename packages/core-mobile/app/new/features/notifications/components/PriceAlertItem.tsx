import React, { FC, useMemo } from 'react'
import { MiniChart, Text } from '@avalabs/k2-alpine'
import { colors } from '@avalabs/k2-alpine/src/theme/tokens/colors'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { ChartData } from 'services/token/types'
import { AppNotification, isPriceAlertNotification } from '../types'
import NotificationListItem from './NotificationListItem'
import NotificationIcon from './NotificationIcon'

const CHART_WIDTH = 70
const CHART_HEIGHT = 22

type PriceAlertItemProps = {
  notification: AppNotification
  showSeparator: boolean
  accessoryType: 'chevron' | 'none'
  testID?: string
}

const getTitle = (
  notification: AppNotification,
  formatCurrency: (props: { amount: number }) => string
): string => {
  if (!isPriceAlertNotification(notification)) return notification.title
  const { tokenSymbol, currentPrice } = notification.data ?? {}
  if (!tokenSymbol || currentPrice === undefined) return notification.title
  return `${tokenSymbol.toUpperCase()} reached ${formatCurrency({
    amount: currentPrice
  })}`
}

const Subtitle = ({
  notification,
  formatCurrency
}: {
  notification: AppNotification
  formatCurrency: (props: { amount: number }) => string
}): React.JSX.Element | null => {
  if (!isPriceAlertNotification(notification)) return null
  const { currentPrice, priceChangePercent } = notification.data ?? {}
  if (priceChangePercent === undefined) return null

  const priceChangeAmount =
    currentPrice !== undefined
      ? (currentPrice * priceChangePercent) / 100
      : undefined
  const isPositive = priceChangePercent >= 0
  const arrow = isPositive ? '▲' : '▼'
  const sign = isPositive ? '+' : ''
  const dollarColor = isPositive ? colors.$accentTeal : colors.$accentDanger

  return (
    <Text variant="body1">
      {priceChangeAmount !== undefined && (
        <Text sx={{ color: dollarColor }}>
          {`${sign}${formatCurrency({
            amount: Math.abs(priceChangeAmount)
          })} ${arrow} `}
        </Text>
      )}
      <Text sx={{ color: '$textPrimary' }}>
        {`${Math.abs(priceChangePercent).toFixed(2)}%`}
      </Text>
    </Text>
  )
}

const getChart = (
  notification: AppNotification,
  getWatchlistChart: (id: string) => ChartData
): React.JSX.Element | undefined => {
  if (!isPriceAlertNotification(notification)) return undefined
  const tokenId = notification.data?.tokenId
  if (!tokenId) return undefined

  const chartData = getWatchlistChart(tokenId)
  if (chartData.dataPoints.length === 0) return undefined

  return (
    <MiniChart
      style={{ width: CHART_WIDTH, height: CHART_HEIGHT }}
      data={chartData.dataPoints}
      negative={chartData.ranges.diffValue < 0}
      showReferenceLine
    />
  )
}

const PriceAlertItem: FC<PriceAlertItemProps> = ({
  notification,
  showSeparator,
  accessoryType,
  testID
}) => {
  const { getWatchlistChart } = useWatchlist()
  const { formatCurrency } = useFormatCurrency()

  const chart = useMemo(
    () => getChart(notification, getWatchlistChart),
    [notification, getWatchlistChart]
  )

  return (
    <NotificationListItem
      title={getTitle(notification, formatCurrency)}
      subtitle={
        <Subtitle notification={notification} formatCurrency={formatCurrency} />
      }
      icon={<NotificationIcon notification={notification} />}
      rightAccessory={chart}
      timestamp={notification.timestamp}
      showSeparator={showSeparator}
      accessoryType={accessoryType}
      testID={testID}
    />
  )
}

export default PriceAlertItem
