import AvaText from 'components/AvaText'
import { FC } from 'react'
import { DeFiPerpetualItem } from 'services/defi/types'
import React from 'react'
import { Row } from 'components/Row'
import { View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { profitLossColors } from 'screens/defi/utils'

interface Props {
  items: DeFiPerpetualItem[]
}

export const DeFiPortfolioPerpetual: FC<Props> = ({ items }) => {
  const { currencyFormatter } = useApplicationContext().appHook
  const { theme } = useApplicationContext()

  const addSpaceWithOperator = (value: number) => {
    const currencyValue = currencyFormatter(value)
    const numberValue = Number(currencyValue.replace('$', '').replace(',', ''))
    const addSpaceCondition =
      numberValue < 0
        ? currencyValue.replace('-', '- ')
        : '+ '.concat(currencyValue)
    return addSpaceCondition
  }
  return (
    <View style={{ marginTop: 8, marginBottom: 8 }}>
      <Row
        style={{
          justifyContent: 'space-between',
          marginTop: 8
        }}>
        <AvaText.InputLabel>Token Pair</AvaText.InputLabel>
        <AvaText.InputLabel>Value</AvaText.InputLabel>
      </Row>
      {items.map(
        (
          { marginToken, positionToken, profitUsdValue, netUsdValue },
          index
        ) => {
          return (
            <View key={`defi-perpetual-${index}`}>
              <Row style={{ justifyContent: 'space-between', marginTop: 8 }}>
                <AvaText.Body2 color={theme.neutral50}>
                  {positionToken.symbol}/{marginToken.symbol}
                </AvaText.Body2>
                <AvaText.Body2 color={theme.neutral50}>
                  {currencyFormatter(netUsdValue)}
                </AvaText.Body2>
              </Row>
              <Row style={{ justifyContent: 'space-between', marginTop: 4 }}>
                <View>
                  <AvaText.Caption color={theme.neutral400}>
                    PnL
                  </AvaText.Caption>
                </View>
                <AvaText.Caption
                  color={profitLossColors(theme, profitUsdValue)}>
                  {addSpaceWithOperator(profitUsdValue)}
                </AvaText.Caption>
              </Row>
            </View>
          )
        }
      )}
    </View>
  )
}
