import AvaText from 'components/AvaText'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Card from 'components/Card'
import { truncateNodeId } from 'utils/Utils'
import Separator from 'components/Separator'
import { Avalanche } from '@avalabs/wallets-sdk'
import { bigIntToString } from '@avalabs/utils-sdk'
import { selectAvaxPrice } from 'store/balance'
import { useSelector } from 'react-redux'
import { format } from 'date-fns'

const AddSubnetValidatorTxView = ({
  tx
}: {
  tx: Avalanche.AddSubnetValidatorTx
}) => {
  const { theme } = useApplicationContext()
  const { currencyFormatter } = useApplicationContext().appHook
  const avaxPrice = useSelector(selectAvaxPrice)
  const { txFee, nodeID, start, end, subnetID } = tx
  const txFeeNumber = Number(bigIntToString(txFee, 9))
  const startDate = format(
    new Date(parseInt(start) * 1000),
    'MMM dd, YYYY, HH:mm A'
  )
  const endDate = format(
    new Date(parseInt(end) * 1000),
    'MMM dd, YYYY, HH:mm A'
  )

  return (
    <View>
      <AvaText.Heading4>Approve Add Subnet Validator</AvaText.Heading4>
      <Space y={28} />
      <AvaText.Body2 color={theme.colorText1} textStyle={{ lineHeight: 20 }}>
        Staking Details
      </AvaText.Body2>
      <Space y={8} />
      <Card style={styles.cardContainer}>
        <Row style={styles.rowContainer}>
          <AvaText.Caption color={theme.colorText2}>Subnet ID</AvaText.Caption>
        </Row>
        <Space y={4} />
        <Row style={styles.rowContainer}>
          <AvaText.Caption color={theme.colorText1}>
            {truncateNodeId(subnetID, 28)}
          </AvaText.Caption>
        </Row>
        <Space y={8} />
        <Row style={styles.rowContainer}>
          <AvaText.Caption color={theme.colorText2}>Node ID</AvaText.Caption>
        </Row>
        <Space y={4} />
        <Row style={styles.rowContainer}>
          <AvaText.Caption color={theme.colorText1}>{nodeID}</AvaText.Caption>
        </Row>
        <Separator style={styles.separator} color={theme.neutral800} />
        <Row style={styles.rowCenterContainer}>
          <AvaText.Caption color={theme.colorText1}>Start Date</AvaText.Caption>
          <AvaText.Subtitle2 color={theme.colorText1}>
            {startDate.toLocaleString()}
          </AvaText.Subtitle2>
        </Row>
        <Space y={8} />
        <Row style={styles.rowCenterContainer}>
          <AvaText.Caption color={theme.colorText1}>End Date</AvaText.Caption>
          <AvaText.Subtitle2 color={theme.colorText1}>
            {endDate.toLocaleString()}
          </AvaText.Subtitle2>
        </Row>
      </Card>

      <Space y={24} />
      <AvaText.Body2 color={theme.colorText1} textStyle={{ lineHeight: 20 }}>
        Network Fee
      </AvaText.Body2>
      <Space y={8} />
      <Card style={styles.cardContainer}>
        <Row style={styles.rowCenterContainer}>
          <AvaText.Caption color={theme.colorText1}>Fee Amount</AvaText.Caption>
          <View style={styles.feeContainer}>
            <AvaText.Subtitle2 color={theme.neutral50}>
              {txFeeNumber} AVAX
            </AvaText.Subtitle2>
          </View>
        </Row>
        <Space y={2} />
        <Row style={styles.currencyContainer}>
          <AvaText.Caption color={theme.neutral400}>
            {currencyFormatter(txFeeNumber * avaxPrice)}
          </AvaText.Caption>
        </Row>
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  rowContainer: {
    justifyContent: 'space-between'
  },
  rowCenterContainer: {
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  separator: {
    marginVertical: 16
  },
  innerRow: {
    alignItems: 'center'
  },
  feeContainer: {
    alignItems: 'flex-end'
  },
  currencyContainer: {
    justifyContent: 'flex-end'
  },
  cardContainer: {
    padding: 16
  }
})

export default AddSubnetValidatorTxView
