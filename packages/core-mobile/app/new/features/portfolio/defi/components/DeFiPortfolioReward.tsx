import React from 'react'
import { DeFiRewardItem } from 'services/defi/types'
import { Row } from 'components/Row'
import { useExchangedAmount } from 'new/common/hooks/useExchangedAmount'
import { StackedImages } from 'components/StackedImages'
import { Card, Separator, Text, useTheme, View } from '@avalabs/k2-alpine'
import { IMAGE_SIZE, MAX_TOKEN_COUNT } from '../consts'
import { DeFiRowItem } from './DeFiRowItem'

export const DeFiPortfolioReward = ({
  items
}: {
  items: DeFiRewardItem[]
}): JSX.Element => {
  const { theme } = useTheme()
  const getAmount = useExchangedAmount()

  return (
    <View style={{ gap: 10 }}>
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
          <Card
            key={`defi-rewards-${index}`}
            sx={{
              alignItems: 'stretch',
              padding: 0
            }}>
            <DeFiRowItem>
              <Text variant="body1">Pool</Text>
            </DeFiRowItem>
            <Separator sx={{ marginHorizontal: 16 }} />
            <DeFiRowItem>
              <Row style={{ marginRight: 8 }}>
                <StackedImages
                  imageUrls={logos}
                  size={IMAGE_SIZE}
                  style={{
                    borderColor: theme.colors.$surfaceSecondary,
                    borderWidth: 1,
                    backgroundColor: theme.colors.$surfaceSecondary
                  }}
                />
              </Row>
              <Row
                style={{
                  flex: 1,
                  marginRight: 10,
                  maxWidth: '70%'
                }}>
                <Text
                  numberOfLines={1}
                  variant="body1"
                  ellipsizeMode="tail"
                  sx={{ color: '$textSecondary' }}>
                  {symbols}
                </Text>
              </Row>
              <Row>
                <Text variant="body1" sx={{ color: '$textSecondary' }}>
                  {getAmount(netUsdValue)}
                </Text>
              </Row>
            </DeFiRowItem>
          </Card>
        )
      })}
    </View>
  )
}
