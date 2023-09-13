import AvaText from 'components/AvaText'
import { Image, View } from 'react-native'
import { DeFiToken } from 'services/defi/types'
import React from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'

type SectionProps = {
  headers: string[]
  tokens: DeFiToken[]
}

export const DeFiLendingSection = ({ headers, tokens }: SectionProps) => {
  const {
    theme,
    appHook: { currencyFormatter }
  } = useApplicationContext()
  return (
    <View style={{ marginTop: 16 }}>
      <View
        style={{
          justifyContent: 'space-between',
          flexDirection: 'row'
        }}>
        {headers.map(header => (
          <AvaText.Body1 key={header}>{header}</AvaText.Body1>
        ))}
      </View>

      {tokens.map(token => (
        <View
          style={{
            justifyContent: 'space-between',
            flexDirection: 'row',
            marginTop: 8
          }}
          key={token.symbol}>
          <View style={{ flexDirection: 'row' }}>
            <Image
              source={{ uri: token.logoUrl }}
              style={{ width: 16, height: 16 }}
            />
            <Space x={8} />
            <AvaText.Body2 color={theme.neutral50}>{token.name}</AvaText.Body2>
          </View>
          <AvaText.Caption color={theme.neutral50}>
            {currencyFormatter(token.amount * token.price)}
          </AvaText.Caption>
        </View>
      ))}
    </View>
  )
}
