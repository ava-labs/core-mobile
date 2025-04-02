import React, { FC } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import MarketTriangleSVG from 'components/MarketTriangleSVG'
import AvaText from 'components/AvaText'
import { formatLargeCurrency } from 'utils/Utils'
import { StyleProp, StyleSheet, ViewStyle } from 'react-native'
import { Row } from 'components/Row'
import { Text } from '@avalabs/k2-mobile'
import { UNKNOWN_AMOUNT } from 'consts/amount'

interface Props {
  priceChange: number
  percentChange: number
  hideDifference?: boolean
  hidePercentage?: boolean
  style?: StyleProp<ViewStyle>
  testID?: string
  currency?: string
}

const MarketMovement: FC<Props> = ({
  priceChange,
  percentChange,
  hideDifference,
  hidePercentage,
  style,
  testID
}) => {
  const theme = useApplicationContext().theme
  const { tokenInCurrencyFormatter } = useApplicationContext().appHook

  if (priceChange === 0 && percentChange === 0) {
    const textColor = theme.colorText2
    const textStyle = {
      color: textColor
    }

    return (
      <AvaText.Caption textStyle={textStyle}>
        {tokenInCurrencyFormatter(0).replace('0.00', UNKNOWN_AMOUNT)}
      </AvaText.Caption>
    )
  }

  const negative = priceChange < 0 || percentChange < 0
  const textColor = negative ? theme.colorError : theme.colorSuccess

  const formattedPrice = formatLargeCurrency(
    tokenInCurrencyFormatter(Math.abs(priceChange))
  )

  const formattedPercent = hideDifference
    ? `${percentChange.toFixed(2).replace('-', '')}%`
    : `(${percentChange.toFixed(2).replace('-', '')}%)`

  const textToDisplay =
    ' ' +
    `${hideDifference ? '' : formattedPrice} ${
      hidePercentage ? '' : formattedPercent
    }`.trim()

  return (
    <Row style={[styles.container, style]} testID={testID}>
      <MarketTriangleSVG
        direction={negative ? 'down' : 'up'}
        color={textColor}
      />
      <Text
        style={{ color: textColor, fontWeight: '500', lineHeight: 15 }}
        variant="caption"
        numberOfLines={1}
        ellipsizeMode="middle">
        {textToDisplay}
      </Text>
    </Row>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end'
  }
})

export default MarketMovement
