import React, { FC } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import MarketTriangleSVG from 'components/MarketTriangleSVG'
import { formatLargeCurrency } from 'utils/Utils'
import { Text, View, useTheme } from '@avalabs/k2-mobile'

interface Props {
  priceChange: number
  percentChange: number
  isVertical?: boolean
  textVariant?: 'overline' | 'buttonSmall'
  testID?: string
}

const MarketTrend: FC<Props> = ({
  priceChange,
  percentChange,
  isVertical = true,
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

  const formattedPercent = `${isVertical ? '' : ' '}${
    priceChange < 0 ? '-' : '+'
  }${Math.abs(percentChange).toFixed(2)}%`

  const tintColor =
    priceChange < 0
      ? colors.$dangerLight
      : priceChange === 0
      ? colors.$neutral400
      : colors.$successMain

  return (
    <View
      sx={
        isVertical
          ? { alignItems: 'center' }
          : {
              flexDirection: 'row',
              alignItems: 'center'
            }
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
          marginTop: isVertical ? -4 : 0
        }}>
        {formattedPercent}
      </Text>
    </View>
  )
}

export default MarketTrend
