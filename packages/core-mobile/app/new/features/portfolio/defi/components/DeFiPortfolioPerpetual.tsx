import { DeFiPerpetualItem } from 'services/defi/types'
import React from 'react'
import { useExchangedAmount } from 'new/common/hooks/useExchangedAmount'
import { Card, Separator, Text, useTheme, View } from '@avalabs/k2-alpine'
import { BalanceText } from 'common/components/BalanceText'
import { IMAGE_SIZE } from '../consts'
import { DeFiRowItem } from './DeFiRowItem'
import { StackedImages } from './StackedImages'

export const DeFiPortfolioPerpetual = ({
  items
}: {
  items: DeFiPerpetualItem[]
}): JSX.Element => {
  const { theme } = useTheme()
  const getAmount = useExchangedAmount()

  const addSpaceWithOperator = (value: number): string => {
    const pnlAmount = getAmount(value, 'compact')
    return value < 0 ? pnlAmount.replace('-', '- ') : '+ '.concat(pnlAmount)
  }

  return (
    <View sx={{ gap: 10 }}>
      {items.map(
        (
          { marginToken, positionToken, profitUsdValue, netUsdValue },
          index
        ) => {
          const imageUrls = [positionToken.logoUrl, marginToken.logoUrl].filter(
            Boolean
          ) as string[]
          return (
            <Card
              key={`defi-perpetual-${index}`}
              sx={{ alignItems: 'stretch', padding: 0 }}>
              <DeFiRowItem>
                <Text variant="body1">Token Pair</Text>
              </DeFiRowItem>
              <Separator sx={{ marginHorizontal: 16 }} />
              <DeFiRowItem>
                <View
                  style={{
                    gap: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    flexShrink: 1,
                    marginRight: 10
                  }}>
                  <StackedImages
                    imageUrls={imageUrls}
                    size={IMAGE_SIZE}
                    style={{
                      borderColor: theme.colors.$surfaceSecondary,
                      borderWidth: 1,
                      backgroundColor: theme.colors.$surfaceSecondary
                    }}
                  />
                  <Text
                    variant="body1"
                    sx={{ color: '$textSecondary', flexShrink: 1 }}>
                    {positionToken.symbol}/{marginToken.symbol}
                  </Text>
                </View>
                <BalanceText variant="body1" sx={{ color: '$textSecondary' }}>
                  {getAmount(netUsdValue, 'compact')}
                </BalanceText>
              </DeFiRowItem>
              <Separator sx={{ marginHorizontal: 16 }} />
              <DeFiRowItem>
                <Text variant="body1">Profit and Loss</Text>
              </DeFiRowItem>
              <Separator sx={{ marginHorizontal: 16 }} />
              <DeFiRowItem>
                <Text variant="body1" sx={{ color: '$textSecondary' }}>
                  Value
                </Text>
                <Text
                  variant="body1"
                  sx={{
                    color: profitUsdValue > 0 ? '$textSuccess' : '$textDanger'
                  }}>
                  {addSpaceWithOperator(profitUsdValue)}
                </Text>
              </DeFiRowItem>
            </Card>
          )
        }
      )}
    </View>
  )
}
