import AvaText from 'components/AvaText'
import React from 'react'
import { View } from 'react-native'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import { AddDelegatorTx } from 'store/walletConnect/handlers/types'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Card from 'components/Card'
import { bigIntToString } from '@avalabs/utils-sdk'
import { truncateNodeId } from 'utils/Utils'
import Separator from 'components/Separator'

const AddDelegatorTxView = ({
  tx,
  avaxPrice
}: {
  tx: AddDelegatorTx
  avaxPrice: number
}) => {
  const { theme } = useApplicationContext()
  const { tokenInCurrencyFormatter } = useApplicationContext().appHook
  const { nodeID, start, end, stake } = tx
  const startDate = new Date(parseInt(start) * 1000)
  const endDate = new Date(parseInt(end) * 1000)

  return (
    <View>
      <AvaText.Heading4>Approve Add Delegator</AvaText.Heading4>
      <Space y={28} />
      <AvaText.TextLink color={theme.colorText1} textStyle={{ lineHeight: 20 }}>
        Staking Details
      </AvaText.TextLink>
      <Space y={8} />
      <Card style={{ padding: 16 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Caption color={theme.colorText2}>Node ID</AvaText.Caption>
          <AvaText.Caption color={theme.colorText1}>
            {truncateNodeId(nodeID)}
          </AvaText.Caption>
        </Row>
        <Space y={8} />
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <AvaText.Caption color={theme.colorText2}>
            Stake Amount
          </AvaText.Caption>
          <AvaText.Subtitle2 color={theme.neutral50}>
            {Number(bigIntToString(stake, 9))} AVAX
          </AvaText.Subtitle2>
        </Row>
        <Row style={{ justifyContent: 'flex-end' }}>
          <AvaText.Caption color={theme.neutral400}>
            {tokenInCurrencyFormatter(
              Number(bigIntToString(stake, 9)) * avaxPrice
            )}
          </AvaText.Caption>
        </Row>
        <Separator style={{ marginVertical: 16 }} color={theme.neutral800} />
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Caption color={theme.colorText2}>Start Date</AvaText.Caption>
          <AvaText.Caption color={theme.colorText1}>
            {startDate.toLocaleString()}
          </AvaText.Caption>
        </Row>
        <Space y={8} />
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Caption color={theme.colorText2}>End Date</AvaText.Caption>
          <AvaText.Caption color={theme.colorText1}>
            {endDate.toLocaleString()}
          </AvaText.Caption>
        </Row>
      </Card>

      <Space y={24} />
      <AvaText.TextLink color={theme.colorText1} textStyle={{ lineHeight: 20 }}>
        Network Fee
      </AvaText.TextLink>
      <Space y={8} />
      <Card style={{ padding: 16 }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <AvaText.Caption color={theme.colorText2}>Fee Amount</AvaText.Caption>
          <AvaText.Subtitle2 color={theme.neutral50}>0 AVAX</AvaText.Subtitle2>
        </Row>
      </Card>
    </View>
  )
}

export default AddDelegatorTxView
