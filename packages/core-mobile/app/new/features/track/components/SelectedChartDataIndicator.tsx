import React, { useMemo } from 'react'
import { getDayString } from 'utils/date/getDayString'
import { Text, View } from '@avalabs/k2-alpine'
import { format } from 'date-fns'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'

export const SelectedChartDataIndicator = ({
  selectedData,
  currentPrice
}: {
  selectedData?: {
    value: number
    date: Date
  }
  currentPrice?: number
}): JSX.Element => {
  const { formatTokenInCurrency } = useFormatCurrency()

  const percentChange = useMemo(() => {
    if (!currentPrice || !selectedData?.value) {
      return 0
    }
    return ((selectedData.value - currentPrice) / currentPrice) * 100
  }, [selectedData, currentPrice])
  const sign = percentChange > 0 ? '+' : percentChange < 0 ? '-' : ''

  const formattedPercentChange = `${sign}${percentChange
    .toFixed(2)
    .replace('-', '')}%`

  return (
    <View sx={{ alignItems: 'center' }}>
      <Text
        variant="subtitle2"
        sx={{
          color: percentChange < 0 ? '$textDanger' : '$textSuccess'
        }}>
        {formattedPercentChange}
      </Text>
      <Text variant="heading2">
        {formatTokenInCurrency(selectedData?.value ?? 0)}
      </Text>
      {selectedData?.date && (
        <Text
          variant="subtitle2"
          sx={{ color: '$textSecondary', marginTop: 3 }}>
          {getDayString(selectedData.date.getTime())},{' '}
          {format(selectedData.date, 'HH:mm')}
        </Text>
      )}
    </View>
  )
}
