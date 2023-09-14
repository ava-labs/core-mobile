import AvaText from 'components/AvaText'
import { Row } from 'components/Row'
import React from 'react'
import { View } from 'react-native'
import { DefiCommonItem } from 'services/defi/types'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { DeFiCommonRow } from './DeFiCommonRow'

const IMAGE_SIZE = 16
const MAX_TOKEN_COUNT = 3

type Props = {
  header: string
  items: DefiCommonItem[]
}

export const DeFiPortfolioCommon = ({ items, header }: Props) => {
  const { theme } = useApplicationContext()

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
        <AvaText.ActivityTotal color={theme.neutral50}>
          {header}
        </AvaText.ActivityTotal>
        <AvaText.ActivityTotal color={theme.neutral50}>
          Value
        </AvaText.ActivityTotal>
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
