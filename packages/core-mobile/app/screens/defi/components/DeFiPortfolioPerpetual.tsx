import AvaText from 'components/AvaText'
import { FC } from 'react'
import { DeFiPerpetualItem } from 'services/defi/types'
import React from 'react'
import { Row } from 'components/Row'
import { View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { profitLossColors } from 'screens/defi/utils'
import { StackedImages } from 'components/StackedImages'
import { useExchangedAmount } from 'hooks/defi/useExchangedAmount'
import { IMAGE_SIZE } from '../const'

const tokenWidth = IMAGE_SIZE * 2

interface Props {
  items: DeFiPerpetualItem[]
}

export const DeFiPortfolioPerpetual: FC<Props> = ({ items }) => {
  const { theme } = useApplicationContext()
  const getAmount = useExchangedAmount()

  const addSpaceWithOperator = (value: number) => {
    const pnlAmount = getAmount(value, 'compact')
    return value < 0 ? pnlAmount.replace('-', '- ') : '+ '.concat(pnlAmount)
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
          const imageUrls = [positionToken.logoUrl, marginToken.logoUrl].filter(
            Boolean
          ) as string[]
          return (
            <View key={`defi-perpetual-${index}`}>
              <Row style={{ justifyContent: 'space-between', marginTop: 8 }}>
                <Row>
                  <StackedImages
                    imageUrls={imageUrls}
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
                  {getAmount(netUsdValue, 'compact')}
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
