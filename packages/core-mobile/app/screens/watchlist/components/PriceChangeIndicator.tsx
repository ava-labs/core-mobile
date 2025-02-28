import React, { FC } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import MarketTriangleSVG from 'components/MarketTriangleSVG'
import { formatLargeCurrency } from 'utils/Utils'
import { Text, View, useTheme } from '@avalabs/k2-mobile'

interface Props {
  price: number
  percent?: number
  isHorizontal?: boolean
  textVariant?: 'overline' | 'buttonSmall' | 'buttonMedium'
  testID?: string
}

const PriceChangeIndicator: FC<Props> = ({
  price,
  percent,
  isHorizontal = true,
  textVariant = 'overline'
}) => {
  const { currencyFormatter } = useApplicationContext().appHook
  const {
    theme: { colors }
  } = useTheme()

  const formattedPrice = formatLargeCurrency(currencyFormatter(Math.abs(price)))

  const formattedPercent = percent
    ? `${isHorizontal ? ' ' : ''}${percent < 0 ? '-' : '+'}${Math.abs(
        isNaN(percent) ? 0 : percent
      ).toFixed(2)}%`
    : undefined

  const signIndicator = percent ?? price
  const tintColor =
    signIndicator < 0
      ? colors.$dangerLight
      : signIndicator === 0
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
        <MarketTriangleSVG
          direction={signIndicator < 0 ? 'down' : 'up'}
          color={tintColor}
        />
        <Text
          variant={textVariant}
          sx={{
            color: tintColor,
            marginLeft: 4
          }}>
          {formattedPrice}
        </Text>
      </View>
      {formattedPercent !== undefined && (
        <Text
          variant={textVariant}
          sx={{
            color: '$neutral400',
            marginTop: isHorizontal ? 0 : -4
          }}>
          {formattedPercent}
        </Text>
      )}
    </View>
  )
}

export default PriceChangeIndicator
