import AvaText from 'components/AvaText'
import { FC } from 'react'
import { DefiInsuranceBuyerItem } from 'services/defi/types'
import React from 'react'
import { Row } from 'components/Row'
import { View } from 'react-native'
import { Popable } from 'react-native-popable'
import { PopableContent } from 'components/PopableContent'
import { PopableLabel } from 'components/PopableLabel'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface Props {
  items: DefiInsuranceBuyerItem[]
}

export const DeFiPortfolioInsurance: FC<Props> = ({ items }) => {
  const { currencyFormatter } = useApplicationContext().appHook

  return (
    <View style={{ marginTop: 8 }}>
      <Row style={{ justifyContent: 'space-between', marginTop: 8 }}>
        <AvaText.Body1>Description</AvaText.Body1>
        <AvaText.Body1>Value</AvaText.Body1>
      </Row>
      {items.map((item, index) => {
        const description = item.description
        const maxDescriptionLength = 30
        return (
          <Row
            key={`defi-insurance-${index}`}
            style={{ justifyContent: 'space-between', marginTop: 8 }}>
            <Popable
              content={<PopableContent message={description} />}
              style={{ width: '30%' }}
              position="right"
              strictPosition={true}>
              <PopableLabel
                label={
                  description.length > maxDescriptionLength
                    ? description.substring(0, maxDescriptionLength - 3) + '...'
                    : description
                }
              />
            </Popable>
            <AvaText.Body2>{currencyFormatter(item.netUsdValue)}</AvaText.Body2>
          </Row>
        )
      })}
    </View>
  )
}
