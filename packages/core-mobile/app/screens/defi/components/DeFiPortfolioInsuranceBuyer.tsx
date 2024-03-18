import AvaText from 'components/AvaText'
import { FC } from 'react'
import { DeFiInsuranceBuyerItem } from 'services/defi/types'
import React from 'react'
import { Row } from 'components/Row'
import { View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useExchangedAmount } from 'hooks/defi/useExchangedAmount'
import { Space } from 'components/Space'
import { Tooltip } from 'components/Tooltip'
import { getDateInMmmDdYyyyHhMmA } from 'utils/date/getDateInMmmDdYyyyHhMmA'

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
          ? getDateInMmmDdYyyyHhMmA(item.expiredAt)
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
                <Tooltip content={description}>
                  <AvaText.Body2 ellipsizeMode="tail" color={theme.neutral50}>
                    {item.description}
                  </AvaText.Body2>
                </Tooltip>
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
