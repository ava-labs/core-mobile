import { Row } from 'components/Row'
import { StackedImages } from 'components/StackedImages'
import React from 'react'
import { Separator, Text, useTheme, View } from '@avalabs/k2-alpine'
import { DeFiToken } from 'services/defi/types'
import { useExchangedAmount } from 'new/common/hooks/useExchangedAmount'

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
      <Row
        style={{
          paddingHorizontal: 16,
          paddingVertical: 13,
          minHeight: 48,
          alignItems: 'center'
        }}>
        <Text variant="body1">{header}</Text>
      </Row>
      <Separator sx={{ marginHorizontal: 16 }} />
      <View sx={{ paddingHorizontal: 16, paddingVertical: 13 }}>
        <Row style={{ gap: 10, alignItems: 'center' }}>
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
          <Row
            style={{
              flex: 1
            }}>
            <View sx={{ flex: 1 }}>
              <Row
                style={{
                  justifyContent: 'space-between'
                }}>
                <Text
                  variant="body1"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  sx={{ color: '$textSecondary' }}>
                  {symbols}
                </Text>
                <Text
                  variant="body1"
                  sx={{ color: '$textSecondary' }}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {getAmount(suppliedValue, 'compact')}
                </Text>
              </Row>
            </View>
          </Row>
        </Row>
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
