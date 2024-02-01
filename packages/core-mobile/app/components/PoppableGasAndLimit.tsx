import React from 'react'
import { View } from 'react-native'
import { Row } from 'components/Row'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { useApplicationContext } from 'contexts/ApplicationContext'

type Props = {
  gasLimit: number
  maxPricePerGas: string
  maxPriorityFeePerGas: string
}

export default function PoppableGasAndLimit({
  gasLimit,
  maxPricePerGas,
  maxPriorityFeePerGas
}: Props): JSX.Element {
  const { theme } = useApplicationContext()

  return (
    <View style={{ padding: 8 }}>
      <Row
        style={{
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
        <AvaText.Body3 textStyle={{ color: theme.neutral900 }}>
          Gas Limit
        </AvaText.Body3>
        <AvaText.Body3 textStyle={{ color: theme.neutral900 }}>
          {gasLimit}
        </AvaText.Body3>
      </Row>
      <Space y={8} />
      <Row
        style={{
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
        <AvaText.Body3 textStyle={{ color: theme.neutral900 }}>
          Max Price Per Gas
        </AvaText.Body3>
        <AvaText.Body3 textStyle={{ color: theme.neutral900 }}>
          {maxPricePerGas}
        </AvaText.Body3>
      </Row>
      <Row
        style={{
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
        <AvaText.Body3 textStyle={{ color: theme.neutral900 }}>
          Max Priority Fee Per Gas
        </AvaText.Body3>
        <AvaText.Body3 textStyle={{ color: theme.neutral900 }}>
          {maxPriorityFeePerGas}
        </AvaText.Body3>
      </Row>
    </View>
  )
}
