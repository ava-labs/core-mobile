import AvaText from 'components/AvaText'
import { FC } from 'react'
import { DeFiPerpetualItem } from 'services/defi/types'
import React from 'react'
import { Row } from 'components/Row'
import { View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface Props {
  items: DeFiPerpetualItem[]
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
          marginTop: 4
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
            <View key={`defi-perpetual-${index}`}>
              <Row style={{ justifyContent: 'space-between', marginTop: 4 }}>
                <AvaText.Body2>
                  {positionToken.symbol}/{marginToken.symbol}
                </AvaText.Body2>
                <AvaText.Body2>{currencyFormatter(netUsdValue)}</AvaText.Body2>
              </Row>
              <Row style={{ justifyContent: 'space-between', marginTop: 4 }}>
                <View style={{ marginTop: 2 }}>
                  <AvaText.Body2>PnL</AvaText.Body2>
                </View>
                <AvaText.Body2 color={pNLtextColor(profitUsdValue)}>
                  {currencyFormatter(profitUsdValue)}
                </AvaText.Body2>
              </Row>
            </View>
          )
        }
      )}
    </View>
  )
}
