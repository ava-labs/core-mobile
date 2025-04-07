import { FC } from 'react'
import { DeFiInsuranceBuyerItem } from 'services/defi/types'
import React from 'react'
import { useExchangedAmount } from 'new/common/hooks/useExchangedAmount'
import { getDateInMmmDdYyyyHhMmA } from 'utils/date/getDateInMmmDdYyyyHhMmA'
import { Card, Separator, Text, View } from '@avalabs/k2-alpine'
import { DeFiRowItem } from './DeFiRowItem'

interface Props {
  items: DeFiInsuranceBuyerItem[]
}

export const DeFiPortfolioInsuranceBuyer: FC<Props> = ({ items }) => {
  const getAmount = useExchangedAmount()

  return (
    <View sx={{ gap: 10 }}>
      {items.map((item, index) => {
        const description = item.description
        const expiredAt = item.expiredAt
          ? getDateInMmmDdYyyyHhMmA(item.expiredAt)
          : undefined

        return (
          <Card
            key={`defi-insurance-${index}`}
            sx={{ alignItems: 'stretch', padding: 0 }}>
            <DeFiRowItem>
              <Text variant="body1">Description</Text>
            </DeFiRowItem>
            <Separator sx={{ marginHorizontal: 16 }} />
            <DeFiRowItem>
              <Text
                variant="body2"
                sx={{
                  marginRight: 10,
                  flexShrink: 1,
                  color: '$textSecondary'
                }}>
                {description}
              </Text>
              <Text
                variant="body2"
                sx={{
                  color: '$textSecondary'
                }}>
                {getAmount(item.netUsdValue)}
              </Text>
            </DeFiRowItem>
            <Separator sx={{ marginHorizontal: 16 }} />
            <DeFiRowItem>
              <Text variant="body1">Expires at</Text>
            </DeFiRowItem>
            <Separator sx={{ marginHorizontal: 16 }} />
            <DeFiRowItem>
              <Text
                variant="body1"
                sx={{
                  color: '$textSecondary'
                }}>
                {expiredAt}
              </Text>
            </DeFiRowItem>
          </Card>
        )
      })}
    </View>
  )
}
