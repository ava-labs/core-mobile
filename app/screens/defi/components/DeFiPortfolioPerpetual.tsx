import AvaText from 'components/AvaText'
import { FC } from 'react'
import { DeFiPerpetualItem } from 'services/defi/types'
import React from 'react'
import { Row } from 'components/Row'
import { View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { profitLossColors } from 'screens/defi/utils'
import { StackedImages } from 'components/StackedImages'

interface Props {
  items: DeFiPerpetualItem[]
}

const IMAGE_SIZE = 20

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
          const tokenWidth = IMAGE_SIZE * 2
          return (
            <View key={`defi-perpetual-${index}`}>
              <Row style={{ justifyContent: 'space-between', marginTop: 8 }}>
                <Row>
                  <StackedImages
                    imageUrls={[positionToken.logoUrl, marginToken.logoUrl]}
                    size={IMAGE_SIZE}
                    style={{ borderColor: theme.colorBg2, borderWidth: 2 }}
                  />
                </Row>
                <Row style={{ flex: 1, marginHorizontal: 8 }}>
                  <AvaText.Body2 color={theme.neutral50}>
                    {positionToken.symbol}/{marginToken.symbol}
                  </AvaText.Body2>
                </Row>
                <AvaText.Body2 color={theme.neutral50}>
                  {currencyFormatter(netUsdValue)}
                </AvaText.Body2>
              </Row>
              <Row style={{ justifyContent: 'space-between', marginTop: 4 }}>
                <View style={{ marginLeft: tokenWidth, marginBottom: 8 }}>
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
