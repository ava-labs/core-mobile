import AvaText from 'components/AvaText'
import { Row } from 'components/Row'
import { StackedImages } from 'components/StackedImages'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useExchangedAmount } from 'hooks/defi/useExchangedAmount'
import React from 'react'
import { View } from 'react-native'
import { DeFiToken } from 'services/defi/types'

type Props = {
  index: number
  supplyTokens: DeFiToken[]
  rewardTokens?: DeFiToken[]
  tokenWidth?: number
  maxTokenCount?: number
  imageSize?: number
}

export const DeFiCommonRow = ({
  supplyTokens = [],
  rewardTokens = [],
  tokenWidth = 16,
  index,
  maxTokenCount = 3,
  imageSize = 16
}: Props) => {
  const { theme } = useApplicationContext()
  const getAmount = useExchangedAmount()

  const hasRewards = rewardTokens.length > 0
  const rewardedValue = rewardTokens.reduce(
    (total, { amount, price }) => total + amount * price,
    0
  )
  const suppliedValue = supplyTokens.reduce(
    (total, { amount, price }) => total + amount * price,
    0
  )
  const maxDisplayedTokens = supplyTokens
    .slice(0, maxTokenCount)
    .map(token => token.logoUrl)
  const symbols = supplyTokens
    .slice(0, maxTokenCount)
    .map(({ symbol }) => symbol)
    .join(' + ')

  return (
    <View style={{ marginTop: index === 0 ? 8 : 16 }}>
      <Row style={{ justifyContent: 'space-between', width: '100%' }}>
        <Row style={{ width: tokenWidth }}>
          <StackedImages imageUrls={maxDisplayedTokens} size={imageSize} />
        </Row>
        <Row
          style={{
            marginHorizontal: 8,
            flex: 1
          }}>
          <AvaText.Body2
            numberOfLines={1}
            ellipsizeMode="tail"
            color={theme.neutral50}>
            {symbols}
          </AvaText.Body2>
        </Row>
        <Row
          style={{
            justifyContent: 'flex-end'
          }}>
          <AvaText.Body2
            color={theme.neutral50}
            numberOfLines={1}
            ellipsizeMode="tail">
            {getAmount(suppliedValue)}
          </AvaText.Body2>
        </Row>
      </Row>
      {hasRewards && (
        <Row
          style={{
            justifyContent: 'space-between',
            marginTop: 4,
            marginLeft: tokenWidth + 8
          }}>
          <AvaText.Caption color={theme.neutral400}>Rewards</AvaText.Caption>
          <AvaText.Caption color={theme.neutral400}>
            {getAmount(rewardedValue)}
          </AvaText.Caption>
        </Row>
      )}
    </View>
  )
}
