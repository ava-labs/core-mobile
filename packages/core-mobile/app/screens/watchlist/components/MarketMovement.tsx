import React, { FC } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import MarketTriangleSVG from 'components/MarketTriangleSVG'
import AvaText from 'components/AvaText'
import { formatLargeCurrency } from 'utils/Utils'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useSelector } from 'react-redux'
import { StyleSheet } from 'react-native'
import { Row } from 'components/Row'

interface Props {
  priceChange: number
  percentChange: number
  hideDifference?: boolean
  hidePercentage?: boolean
  hideCurrencyCode?: boolean
  testID?: string
}

const MarketMovement: FC<Props> = ({
  priceChange,
  percentChange,
  hideDifference,
  hidePercentage,
  hideCurrencyCode,
  testID
}) => {
  const theme = useApplicationContext().theme
  const { tokenInCurrencyFormatter } = useApplicationContext().appHook
  const selectedCurrency = useSelector(selectSelectedCurrency)

  if (priceChange === 0 && percentChange === 0) {
    const textColor = theme.colorText2
    const textStyle = {
      color: textColor
    }

    return <AvaText.Caption textStyle={textStyle}>$ -</AvaText.Caption>
  }

  const negative = priceChange < 0 || percentChange < 0
  const textColor = negative ? theme.colorError : theme.colorSuccess

  let formattedPrice = formatLargeCurrency(
    tokenInCurrencyFormatter(Math.abs(priceChange))
  )

  if (hideCurrencyCode)
    formattedPrice = formattedPrice.replace(selectedCurrency, '')

  const formattedPercent = hideDifference
    ? `${percentChange.toFixed(2).replace('-', '')}%`
    : `(${percentChange.toFixed(2).replace('-', '')}%)`

  const textToDisplay = `${hideDifference ? '' : formattedPrice}  ${
    hidePercentage ? '' : formattedPercent
  }`.trim()

  return (
    <Row style={styles.container}>
      <MarketTriangleSVG
        direction={negative ? 'down' : 'up'}
        color={textColor}
      />
      <AvaText.Caption
        textStyle={{ color: textColor, fontWeight: '500' }}
        testID={testID}>
        {' ' + textToDisplay}
      </AvaText.Caption>
    </Row>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' }
})

export default MarketMovement
