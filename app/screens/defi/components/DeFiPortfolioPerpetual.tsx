import AvaText from 'components/AvaText'
import { FC } from 'react'
import { DefiPerpetualItem } from 'services/defi/types'
import React from 'react'
import { Row } from 'components/Row'
import { View } from 'react-native'

interface Props {
  items: DefiPerpetualItem[]
}

const roundValueTwoDecimals = (value: number) => {
  return (Math.round(value * 100) / 100).toFixed(2)
}

export const DeFiPortfolioPerpetual: FC<Props> = ({ items }) => {
  return (
    <View style={{ marginTop: 8 }}>
      <Row
        style={{
          justifyContent: 'space-between',
          marginTop: 8
        }}>
        <AvaText.Body1>Token Pair</AvaText.Body1>
        <View style={{ marginLeft: 20 }}>
          <AvaText.Body1>Profit</AvaText.Body1>
        </View>
        <View style={{ marginRight: 8 }}>
          <AvaText.Body1>Value</AvaText.Body1>
        </View>
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
              </AvaText.Body2>
              <AvaText.Body2>
                {roundValueTwoDecimals(profitUsdValue)}
              </AvaText.Body2>
              <AvaText.Body2>
                {roundValueTwoDecimals(netUsdValue)}
              </AvaText.Body2>
            </Row>
          )
        }
      )}
    </View>
  )
}
