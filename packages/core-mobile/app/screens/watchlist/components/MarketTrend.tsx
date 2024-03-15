import React, { FC } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import MarketTriangleSVG from 'components/MarketTriangleSVG'
import { formatLargeCurrency } from 'utils/Utils'
import { Text, View, useTheme } from '@avalabs/k2-mobile'

interface Props {
  priceChange: number
  percentChange: number
  isHorizontal?: boolean
  textVariant?: 'overline' | 'buttonSmall'
  testID?: string
}

const MarketTrend: FC<Props> = ({
  priceChange,
  percentChange,
  isHorizontal = true,
  textVariant = 'overline'
}) => {
  const { currencyFormatter } = useApplicationContext().appHook
  const {
    theme: { colors }
  } = useTheme()

  const formattedPrice = formatLargeCurrency(
    currencyFormatter(Math.abs(priceChange)),
    2
  )

  const formattedPercent = `${isHorizontal ? ' ' : ''}${
    priceChange < 0 ? '-' : '+'
  }${Math.abs(isNaN(percentChange) ? 0 : percentChange).toFixed(2)}%`

  const tintColor =
    priceChange < 0
      ? colors.$dangerLight
      : priceChange === 0
      ? colors.$neutral400
      : colors.$successMain

  return (
    <View
      sx={
        isHorizontal
          ? {
              flexDirection: 'row',
              alignItems: 'center'
            }
          : { alignItems: 'center' }
      }>
      <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
        <MarketTriangleSVG negative={priceChange < 0} color={tintColor} />
        <Text
          variant={textVariant}
          sx={{
            color: tintColor,
            marginLeft: 4
          }}>
          {formattedPrice}
        </Text>
      </View>
      <Text
        variant={textVariant}
        sx={{
          color: '$neutral400',
          marginTop: isHorizontal ? 0 : -4
        }}>
        {formattedPercent}
      </Text>
    </View>
  )
}

export default MarketTrend
