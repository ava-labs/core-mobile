import AvaText from 'components/AvaText'
import { FC } from 'react'
import { DeFiInsuranceBuyerItem } from 'services/defi/types'
import React from 'react'
import { Row } from 'components/Row'
import { View } from 'react-native'
import { Popable } from 'react-native-popable'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useExchangedAmount } from 'hooks/defi/useExchangedAmount'
import { PopableContent } from 'components/PopableContent'
import { format } from 'date-fns'
import { Space } from 'components/Space'

interface Props {
  items: DeFiInsuranceBuyerItem[]
}

export const DeFiPortfolioInsuranceBuyer: FC<Props> = ({ items }) => {
  const { theme } = useApplicationContext()
  const getAmount = useExchangedAmount()

  return (
    <View style={{ marginTop: 8 }}>
      <Row
        style={{
          justifyContent: 'space-between',
          marginTop: 8
        }}>
        <AvaText.InputLabel>Description</AvaText.InputLabel>
        <AvaText.InputLabel>Value</AvaText.InputLabel>
      </Row>
      {items.map((item, index) => {
        const description = item.description
        const expiredAt = item.expiredAt
          ? format(new Date(item.expiredAt * 1000), 'MMM dd, yyyy, HH:mm a')
          : undefined

        return (
          <View key={`defi-insurance-${index}`} style={{ marginTop: 8 }}>
            <Row
              style={{
                width: '100%',
                marginTop: 8,
                justifyContent: 'space-between'
              }}>
              <Row
                style={{
                  flex: 1,
                  marginRight: 10,
                  maxWidth: '80%'
                }}>
                <Popable
                  content={<PopableContent message={description} />}
                  position="top"
                  backgroundColor={theme.neutral100}>
                  <AvaText.Body2 ellipsizeMode="tail" color={theme.neutral50}>
                    {item.description}
                  </AvaText.Body2>
                </Popable>
              </Row>
              <AvaText.Body2 color={theme.neutral50}>
                {getAmount(item.netUsdValue)}
              </AvaText.Body2>
            </Row>
            <Space y={4} />
            <AvaText.Caption color={theme.neutral400}>
              Expires at {expiredAt}
            </AvaText.Caption>
          </View>
        )
      })}
    </View>
  )
}
