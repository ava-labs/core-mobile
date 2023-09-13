import AvaText from 'components/AvaText'
import { FC } from 'react'
import { DefiInsuranceBuyerItem } from 'services/defi/types'
import React from 'react'
import { Row } from 'components/Row'
import { View } from 'react-native'

interface Props {
  items: DefiInsuranceBuyerItem[]
}

export const DeFiPortfolioInsurance: FC<Props> = ({ items }) => {
  return (
    <View style={{ marginTop: 8 }}>
      <Row style={{ justifyContent: 'space-between', marginTop: 8 }}>
        <AvaText.Body1>Description</AvaText.Body1>
        <AvaText.Body1>Value</AvaText.Body1>
      </Row>
      {items.map((item, index) => {
        return (
          <Row
            key={`defi-insurance-${index}`}
            style={{ justifyContent: 'space-between', marginTop: 8 }}>
            <AvaText.Body2>{item.description}</AvaText.Body2>
            <AvaText.Body2>{item.netUsdValue}</AvaText.Body2>
          </Row>
        )
      })}
    </View>
  )
}
