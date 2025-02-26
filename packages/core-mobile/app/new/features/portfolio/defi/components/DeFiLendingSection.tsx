import { Image } from 'react-native'
import { DeFiToken } from 'services/defi/types'
import React from 'react'
import { Row } from 'components/Row'
import { useExchangedAmount } from 'hooks/defi/useExchangedAmount'
import { Separator, Text, useTheme, View } from '@avalabs/k2-alpine'
import { IMAGE_SIZE } from '../consts'
import { DeFiRowItem } from './DeFiRowItem'

type SectionProps = {
  header: string
  tokens: DeFiToken[]
}

export const DeFiLendingSection = ({
  header,
  tokens
}: SectionProps): JSX.Element => {
  const { theme } = useTheme()
  const getAmount = useExchangedAmount()
  const amountTextColor =
    header === 'Borrowed'
      ? theme.colors.$textDanger
      : theme.colors.$textSecondary

  const numberSign = header === 'Borrowed' ? '- ' : ''

  return (
    <>
      <DeFiRowItem>
        <Text variant="body1">{header}</Text>
      </DeFiRowItem>
      <Separator sx={{ marginHorizontal: 16 }} />
      {tokens.map((token, index) => (
        <View key={index}>
          <DeFiRowItem key={token.symbol}>
            <Row style={{ flex: 1, alignItems: 'center', gap: 12 }}>
              <Image
                source={{ uri: token.logoUrl }}
                style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}
              />
              <Text
                variant="body1"
                numberOfLines={1}
                ellipsizeMode="tail"
                sx={{ color: '$textSecondary', flexShrink: 1 }}>
                {token.symbol}
              </Text>
            </Row>
            <Text variant="body1" sx={{ color: amountTextColor }}>
              {numberSign}
              {getAmount(token.amount * token.price, 'compact')}
            </Text>
          </DeFiRowItem>
          {index !== tokens.length - 1 && (
            <Separator sx={{ marginHorizontal: 16 }} />
          )}
        </View>
      ))}
    </>
  )
}
