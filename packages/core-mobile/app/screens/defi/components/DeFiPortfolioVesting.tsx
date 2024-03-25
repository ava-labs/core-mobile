import AvaText from 'components/AvaText'
import { Row } from 'components/Row'
import React from 'react'
import { Image, View } from 'react-native'
import { DeFiVestingItem } from 'services/defi/types'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useExchangedAmount } from 'hooks/defi/useExchangedAmount'
import { Space } from 'components/Space'
import { getDateInMmmDdYyyyHhMmA } from 'utils/date/getDateInMmmDdYyyyHhMmA'

type Props = {
  items: DeFiVestingItem[]
}

export const DeFiPortfolioVesting = ({ items }: Props): JSX.Element => {
  const { theme } = useApplicationContext()
  const getAmount = useExchangedAmount()
  return (
    <View style={{ marginTop: 16 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <AvaText.ActivityTotal color={theme.neutral50}>
          Pool
        </AvaText.ActivityTotal>
        <AvaText.ActivityTotal color={theme.neutral50}>
          Value
        </AvaText.ActivityTotal>
      </Row>
      <View>
        {items.map(({ token, netUsdValue, endAt }, index) => {
          const endDate = endAt ? getDateInMmmDdYyyyHhMmA(endAt) : undefined

          return (
            <View
              style={{ marginTop: index === 0 ? 8 : 16 }}
              key={`defi-vesting-${index}`}>
              <Row style={{ justifyContent: 'space-between', width: '100%' }}>
                <Row>
                  <Image
                    source={{ uri: token.logoUrl }}
                    style={{ width: 16, height: 16 }}
                  />
                </Row>
                <Row
                  style={{
                    marginHorizontal: 8,
                    flex: 1
                  }}>
                  <AvaText.Body2
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    color={theme.neutral50}>
                    {token.name}
                  </AvaText.Body2>
                </Row>
                <Row
                  style={{
                    justifyContent: 'flex-end'
                  }}>
                  <AvaText.Body2
                    color={theme.neutral50}
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {getAmount(netUsdValue, 'compact')}
                  </AvaText.Body2>
                </Row>
              </Row>
              {endDate && (
                <Row
                  style={{
                    marginTop: 4,
                    marginLeft: 24
                  }}>
                  <AvaText.Caption color={theme.neutral400}>
                    Ends at
                  </AvaText.Caption>
                  <Space x={4} />
                  <AvaText.Caption color={theme.neutral400}>
                    {endDate}
                  </AvaText.Caption>
                </Row>
              )}
            </View>
          )
        })}
      </View>
    </View>
  )
}
