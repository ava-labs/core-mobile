import React from 'react'
import { Card, Image, Separator, Text, View } from '@avalabs/k2-alpine'
import { DeFiVestingItem } from 'services/defi/types'
import { useExchangedAmount } from 'new/common/hooks/useExchangedAmount'
import { getDateInMmmDdYyyyHhMmA } from 'utils/date/getDateInMmmDdYyyyHhMmA'
import { BalanceText } from 'common/components/BalanceText'
import { IMAGE_SIZE } from '../consts'
import { DeFiRowItem } from './DeFiRowItem'

type Props = {
  items: DeFiVestingItem[]
}

export const DeFiPortfolioVesting = ({ items }: Props): JSX.Element => {
  const getAmount = useExchangedAmount()
  return (
    <View sx={{ gap: 10 }}>
      {items.map(({ token, netUsdValue, endAt }, index) => {
        const endDate = endAt ? getDateInMmmDdYyyyHhMmA(endAt) : undefined

        return (
          <Card
            sx={{ alignItems: 'stretch', padding: 0 }}
            key={`defi-vesting-${index}`}>
            <DeFiRowItem>
              <Text variant="body1">Pool</Text>
            </DeFiRowItem>
            <Separator sx={{ marginHorizontal: 16 }} />
            <DeFiRowItem>
              <View
                style={{
                  flexDirection: 'row',
                  gap: 8,
                  alignItems: 'center',
                  flexShrink: 1,
                  marginRight: 10
                }}>
                <Image
                  source={{ uri: token.logoUrl }}
                  style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}
                />
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  sx={{ color: '$textSecondary', flexShrink: 1 }}>
                  {token.name}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-end'
                }}>
                <BalanceText
                  variant="body1"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  sx={{ color: '$textSecondary' }}>
                  {getAmount(netUsdValue, 'compact')}
                </BalanceText>
              </View>
            </DeFiRowItem>
            {endDate && (
              <>
                <Separator sx={{ marginHorizontal: 16 }} />
                <DeFiRowItem>
                  <Text variant="body1">Ends at</Text>
                </DeFiRowItem>
                <Separator sx={{ marginHorizontal: 16 }} />
                <DeFiRowItem>
                  <Text
                    variant="body1"
                    sx={{
                      color: '$textSecondary'
                    }}>
                    {endDate}
                  </Text>
                </DeFiRowItem>
              </>
            )}
          </Card>
        )
      })}
    </View>
  )
}
