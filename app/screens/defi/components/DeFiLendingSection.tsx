import AvaText from 'components/AvaText'
import { Image, View } from 'react-native'
import { DeFiToken } from 'services/defi/types'
import React from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Row } from 'components/Row'
import { useExchangedAmount } from 'hooks/defi/useExchangedAmount'

type SectionProps = {
  headers: string[]
  tokens: DeFiToken[]
}

export const DeFiLendingSection = ({ headers, tokens }: SectionProps) => {
  const { theme } = useApplicationContext()
  const getAmount = useExchangedAmount()

  return (
    <View style={{ marginTop: 16 }}>
      <Row
        style={{
          justifyContent: 'space-between'
        }}>
        {headers.map(header => (
          <AvaText.InputLabel key={header}>{header}</AvaText.InputLabel>
        ))}
      </Row>
      {tokens.map(token => (
        <Row
          style={{
            justifyContent: 'space-between',
            marginTop: 8
          }}
          key={token.symbol}>
          <Row style={{ flex: 1 }}>
            <Image
              source={{ uri: token.logoUrl }}
              style={{ width: 16, height: 16 }}
            />
            <View style={{ flex: 1, marginHorizontal: 8 }}>
              <AvaText.Body2
                color={theme.neutral50}
                numberOfLines={1}
                ellipsizeMode="tail">
                {token.name}
              </AvaText.Body2>
            </View>
          </Row>
          <AvaText.Caption color={theme.neutral50}>
            {getAmount(token.amount * token.price)}
          </AvaText.Caption>
        </Row>
      ))}
    </View>
  )
}
