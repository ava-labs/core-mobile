import AvaText from 'components/AvaText'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Card from 'components/Card'
import { truncateNodeId } from 'utils/Utils'
import Separator from 'components/Separator'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { getDateInMmmDdYyyyHhMmA } from 'utils/date/getDateInMmmDdYyyyHhMmA'
import { TxFee } from './components/TxFee'

const AddSubnetValidatorTxView = ({
  tx
}: {
  tx: Avalanche.AddSubnetValidatorTx
}): JSX.Element => {
  const { theme } = useApplicationContext()
  const { txFee, nodeID, start, end, subnetID } = tx
  const startDate = getDateInMmmDdYyyyHhMmA(parseInt(start))
  const endDate = getDateInMmmDdYyyyHhMmA(parseInt(end))

  return (
    <View>
      <AvaText.Heading4>Add Subnet Validator</AvaText.Heading4>
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
      <TxFee txFee={txFee} />
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
  cardContainer: {
    padding: 16
  }
})

export default AddSubnetValidatorTxView
