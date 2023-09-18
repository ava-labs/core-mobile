import AvaText from 'components/AvaText'
import { Row } from 'components/Row'
import React from 'react'
import { View } from 'react-native'
import { DeFiCommonItem } from 'services/defi/types'
import { DeFiCommonRow } from './DeFiCommonRow'

const IMAGE_SIZE = 20
const MAX_TOKEN_COUNT = 3

type Props = {
  header: string
  items: DeFiCommonItem[]
}

export const DeFiPortfolioCommon = ({ items, header }: Props) => {
  const tokenCount = Math.max(
    ...items.map(item => item?.supplyTokens?.length ?? 0)
  )
  const maxTokenCount =
    tokenCount > MAX_TOKEN_COUNT ? MAX_TOKEN_COUNT : tokenCount
  const tokenWidth =
    IMAGE_SIZE * maxTokenCount - IMAGE_SIZE * (maxTokenCount - 1) * 0.4

  return (
    <View style={{ marginTop: 16 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <AvaText.InputLabel>{header}</AvaText.InputLabel>
        <AvaText.InputLabel>Value</AvaText.InputLabel>
      </Row>
      <View>
        {items.map(({ supplyTokens = [], rewardTokens = [] }, index) => (
          <DeFiCommonRow
            key={`defi-common-${index}`}
            supplyTokens={supplyTokens}
            rewardTokens={rewardTokens}
            tokenWidth={tokenWidth}
            index={index}
            maxTokenCount={MAX_TOKEN_COUNT}
            imageSize={IMAGE_SIZE}
          />
        ))}
      </View>
    </View>
  )
}
