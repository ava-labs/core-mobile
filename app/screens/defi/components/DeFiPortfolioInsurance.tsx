import AvaText from 'components/AvaText'
import { FC } from 'react'
import { DeFiInsuranceBuyerItem } from 'services/defi/types'
import React from 'react'
import { Row } from 'components/Row'
import { View } from 'react-native'
import { Popable } from 'react-native-popable'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface Props {
  items: DeFiInsuranceBuyerItem[]
}

export const DeFiPortfolioInsurance: FC<Props> = ({ items }) => {
  const { currencyFormatter } = useApplicationContext().appHook
  const { theme } = useApplicationContext()

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
        return (
          <View
            key={`defi-insurance-${index}`}
            style={{
              flexDirection: 'row',
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
                content={
                  <View style={{ backgroundColor: theme.neutral100 }}>
                    <AvaText.Body4
                      textStyle={{
                        fontWeight: '500',
                        fontSize: 12,
                        color: theme.neutral900,
                        margin: 4
                      }}>
                      {description}
                    </AvaText.Body4>
                  </View>
                }
                position="top">
                <AvaText.Body2 ellipsizeMode="tail">
                  {item.description}
                </AvaText.Body2>
              </Popable>
            </Row>
            <Row>
              <AvaText.Body2>
                {currencyFormatter(item.netUsdValue)}
              </AvaText.Body2>
            </Row>
          </View>
        )
      })}
    </View>
  )
}
