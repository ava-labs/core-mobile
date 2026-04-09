import React, { FC } from 'react'
import {
  ActivityIndicator,
  Icons,
  MiniChart,
  Text,
  View
} from '@avalabs/k2-alpine'
import { colors } from '@avalabs/k2-alpine/src/theme/tokens/colors'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { usePriceAlertChart } from '../hooks/usePriceAlertChart'
import { AppNotification, isPriceAlertNotification } from '../types'
import NotificationListItem from './NotificationListItem'
import NotificationIcon from './NotificationIcon'

const CHART_WIDTH = 76
const CHART_HEIGHT = 22

type PriceAlertItemProps = {
  notification: AppNotification
  showSeparator: boolean
  accessoryType: 'chevron' | 'none'
  index?: number
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
  const sign = isPositive ? '+' : ''
  const dollarColor = isPositive ? colors.$accentSuccessL : colors.$accentDanger
  const arrowColor = isPositive ? colors.$accentSuccessL : colors.$accentDanger

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {priceChangeAmount !== undefined && (
        <Text variant="body1" sx={{ color: dollarColor }}>
          {`${sign}${formatCurrency({ amount: Math.abs(priceChangeAmount) })}`}
        </Text>
      )}
      {isPositive ? (
        <Icons.Custom.TrendingArrowUp
          color={arrowColor}
          width={10}
          height={10}
        />
      ) : (
        <Icons.Custom.TrendingArrowDown
          color={arrowColor}
          width={10}
          height={10}
        />
      )}
      <Text variant="body1" sx={{ color: '$textPrimary' }}>
        {`${Math.abs(priceChangePercent).toFixed(2)}%`}
      </Text>
    </View>
  )
}

const PriceAlertItem: FC<PriceAlertItemProps> = ({
  notification,
  showSeparator,
  accessoryType,
  index,
  testID
}) => {
  const { formatCurrency } = useFormatCurrency()
  const { chartData, isLoading } = usePriceAlertChart(
    notification,
    (index ?? 0) * 100
  )

  let chart: React.JSX.Element | undefined
  if (isLoading) {
    chart = (
      <View
        style={{
          width: CHART_WIDTH,
          height: CHART_HEIGHT,
          marginLeft: 4,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        <ActivityIndicator size="small" />
      </View>
    )
  } else if (chartData && chartData.dataPoints.length >= 2) {
    chart = (
      <MiniChart
        style={{ width: CHART_WIDTH, height: CHART_HEIGHT, marginLeft: 4 }}
        data={chartData.dataPoints}
        negative={chartData.ranges.diffValue < 0}
        showReferenceLine
      />
    )
  }

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
