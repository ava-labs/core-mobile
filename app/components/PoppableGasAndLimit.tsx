import React from 'react'
import { View } from 'react-native'
import { Row } from 'components/Row'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'

type Props = {
  gasLimit: number
  gasPrice: string
}

export default function PoppableGasAndLimit({ gasLimit, gasPrice }: Props) {
  return (
    <View style={{ padding: 8 }}>
      <Row
        style={{
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
        <AvaText.Body3>Gas Limit</AvaText.Body3>
        <AvaText.Body3>{gasLimit}</AvaText.Body3>
      </Row>
      <Space y={8} />
      <Row
        style={{
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
        <AvaText.Body3>Gas Price</AvaText.Body3>
        <AvaText.Body3>{gasPrice}</AvaText.Body3>
      </Row>
    </View>
  )
}
