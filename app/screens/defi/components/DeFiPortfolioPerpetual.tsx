import AvaText from 'components/AvaText'
import { FC } from 'react'
import { DefiPerpetualItem } from 'services/defi/types'
import React from 'react'
import { Row } from 'components/Row'
import { View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface Props {
  items: DefiPerpetualItem[]
}

const roundValueTwoDecimals = (value: number) => {
  return (Math.round(value * 100) / 100).toFixed(2)
}

const pNLtextColor = (value: number) => {
  return value > 0 ? '#53C26E' : '#F34333'
}

export const DeFiPortfolioPerpetual: FC<Props> = ({ items }) => {
  const { currencyFormatter } = useApplicationContext().appHook
  return (
    <View style={{ marginTop: 8 }}>
      <Row
        style={{
          justifyContent: 'space-between',
          marginTop: 8,
          marginRight: 8
        }}>
        <AvaText.Body1>Token Pair</AvaText.Body1>
        <AvaText.Body1>Value</AvaText.Body1>
      </Row>
      {items.map(
        (
          { marginToken, positionToken, profitUsdValue, netUsdValue },
          index
        ) => {
          return (
            <Row
              key={`defi-perpetual-${index}`}
              style={{ justifyContent: 'space-between', marginTop: 8 }}>
              <AvaText.Body2>
                {positionToken.symbol}/{marginToken.symbol}
                {'\n'}
                {'PnL'}
              </AvaText.Body2>
              <AvaText.Body2 currency={true}>
                {currencyFormatter(roundValueTwoDecimals(netUsdValue))}
                {'\n'}
                <AvaText.Body2
                  color={pNLtextColor(profitUsdValue)}
                  currency={true}>
                  {currencyFormatter(roundValueTwoDecimals(profitUsdValue))}
                </AvaText.Body2>
              </AvaText.Body2>
            </Row>
          )
        }
      )}
    </View>
  )
}
