import React from 'react'
import { Separator, Text, useTheme, View } from '@avalabs/k2-alpine'
import { DeFiToken } from 'services/defi/types'
import { useExchangedAmount } from 'new/common/hooks/useExchangedAmount'
import { BalanceText } from 'common/components/BalanceText'
import { StackedImages } from './StackedImages'

export const DeFiCommonRow = ({
  header,
  tokens = [],
  maxTokenCount = 3,
  tokenWidth,
  imageSize = 24
}: Props): JSX.Element => {
  const { theme } = useTheme()
  const getAmount = useExchangedAmount()

  const suppliedValue = tokens.reduce(
    (total, { amount, price }) => total + amount * price,
    0
  )
  const maxDisplayedTokens = tokens
    .slice(0, maxTokenCount)
    .map(token => token.logoUrl)
    .filter(Boolean) as string[]
  const symbols = tokens
    .slice(0, maxTokenCount)
    .map(({ symbol }) => symbol)
    .join(' + ')

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 16,
          paddingVertical: 13,
          minHeight: 48,
          alignItems: 'center'
        }}>
        <Text variant="body1">{header}</Text>
      </View>
      <Separator sx={{ marginHorizontal: 16 }} />
      <View sx={{ paddingHorizontal: 16, paddingVertical: 13 }}>
        <View style={{ gap: 10, flexDirection: 'row', alignItems: 'center' }}>
          <View sx={{ width: tokenWidth }}>
            <StackedImages
              imageUrls={maxDisplayedTokens}
              size={imageSize}
              style={{
                borderColor: theme.colors.$surfaceSecondary,
                borderWidth: 1,
                backgroundColor: theme.colors.$surfaceSecondary
              }}
            />
          </View>
          <View
            style={{
              flex: 1,
              flexDirection: 'row'
            }}>
            <View sx={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between'
                }}>
                <Text
                  variant="body1"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  sx={{ color: '$textSecondary' }}>
                  {symbols}
                </Text>
                <BalanceText
                  variant="body1"
                  sx={{ color: '$textSecondary' }}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {getAmount(suppliedValue, 'compact')}
                </BalanceText>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

type Props = {
  header: string
  tokens: DeFiToken[]
  tokenWidth?: number
  maxTokenCount?: number
  imageSize?: number
}
