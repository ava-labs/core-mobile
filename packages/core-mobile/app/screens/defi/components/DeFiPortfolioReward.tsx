import AvaText from 'components/AvaText'
import React from 'react'
import { DeFiRewardItem } from 'services/defi/types'
import { Row } from 'components/Row'
import { View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useExchangedAmount } from 'hooks/defi/useExchangedAmount'
import { StackedImages } from 'components/StackedImages'
import { IMAGE_SIZE, MAX_TOKEN_COUNT } from '../const'

type Props = {
  items: DeFiRewardItem[]
}

export const DeFiPortfolioReward = ({ items }: Props) => {
  const { theme } = useApplicationContext()
  const getAmount = useExchangedAmount()

  return (
    <View style={{ marginTop: 8, maxWidth: '100%' }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <AvaText.InputLabel>Pool</AvaText.InputLabel>
        <AvaText.InputLabel>Value</AvaText.InputLabel>
      </Row>
      {items.map(({ tokens, netUsdValue }, index) => {
        const symbols = tokens
          ?.slice(0, MAX_TOKEN_COUNT)
          .map(({ symbol }) => symbol)
          .join(' + ')
        const logos = tokens
          ?.slice(0, MAX_TOKEN_COUNT)
          .map(({ logoUrl }) => logoUrl)
          .filter(Boolean) as string[]

        return (
          <View
            key={`defi-rewards-${index}`}
            style={{
              marginTop: 8,
              flexDirection: 'row',
              justifyContent: 'space-between'
            }}>
            <Row style={{ marginRight: 8 }}>
              <StackedImages
                imageUrls={logos}
                size={IMAGE_SIZE}
                style={{ borderColor: theme.colorBg2, borderWidth: 2 }}
              />
            </Row>
            <Row
              style={{
                flex: 1,
                marginRight: 10,
                maxWidth: '70%'
              }}>
              <AvaText.Body2 ellipsizeMode="tail" color={theme.neutral50}>
                {symbols}
              </AvaText.Body2>
            </Row>
            <Row>
              <AvaText.Body2 color={theme.neutral50}>
                {getAmount(netUsdValue)}
              </AvaText.Body2>
            </Row>
          </View>
        )
      })}
    </View>
  )
}
