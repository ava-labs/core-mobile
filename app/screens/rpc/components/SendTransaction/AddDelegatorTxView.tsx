import AvaText from 'components/AvaText'
import React from 'react'
import { View } from 'react-native'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import { AddDelegatorTx } from 'store/walletConnect/handlers/types'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { AvalancheChainStrings } from 'store/walletConnect/handlers/utils/parseAvalancheTx'
import Card from 'components/Card'
import { bigIntToString } from '@avalabs/utils-sdk'

const AddDelegatorTxView = ({
  tx,
  avaxPrice
}: {
  tx: AddDelegatorTx
  avaxPrice: number
}) => {
  const { theme } = useApplicationContext()
  const { tokenInCurrencyFormatter } = useApplicationContext().appHook
  const { nodeID, start, end, stake, chain } = tx
  const startDate = new Date(parseInt(start) * 1000)
  const endDate = new Date(parseInt(end) * 1000)

  return (
    <View>
      <AvaText.Heading2>Approve Add Delegator</AvaText.Heading2>
      <Space y={16} />
      <AvaText.Body2
        color={theme.colorText1}
        textStyle={{ fontFamily: 'Inter-SemiBold' }}>
        Chain: {AvalancheChainStrings[chain]}
      </AvaText.Body2>
      <Space y={8} />
      <Card style={{ padding: 16 }}>
        <View>
          <AvaText.Body3>Node ID</AvaText.Body3>
          <AvaText.Body3>{nodeID}</AvaText.Body3>
        </View>
      </Card>

      <Space y={16} />
      <AvaText.Body2
        color={theme.colorText1}
        textStyle={{ fontFamily: 'Inter-SemiBold' }}>
        Details
      </AvaText.Body2>
      <Space y={8} />
      <Card style={{ padding: 16 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body3>Stake Amount</AvaText.Body3>
          <View>
            <AvaText.Body2>
              {' '}
              {Number(bigIntToString(stake, 9))} AVAX
            </AvaText.Body2>
            <AvaText.Body2>
              {' '}
              {tokenInCurrencyFormatter(
                Number(bigIntToString(stake, 9)) * avaxPrice
              )}
            </AvaText.Body2>
          </View>
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body3>Start Date</AvaText.Body3>
          <AvaText.Body2>{startDate.toLocaleString()}</AvaText.Body2>
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body3>End Date</AvaText.Body3>
          <AvaText.Body2>{endDate.toLocaleString()}</AvaText.Body2>
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body3>Fee</AvaText.Body3>
          <AvaText.Body2>0 AVAX</AvaText.Body2>
        </Row>
      </Card>
    </View>
  )
}

export default AddDelegatorTxView
