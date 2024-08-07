import React from 'react'
import { useTheme } from '@avalabs/k2-mobile'
import { AddSubnetValidatorTx } from '@avalabs/vm-module-types'
import { Space } from 'components/Space'
import Card from 'components/Card'
import { StyleSheet } from 'react-native'
import { Row } from 'components/Row'
import { truncateNodeId } from 'utils/Utils'
import { getDateInMmmDdYyyyHhMmA } from 'utils/date/getDateInMmmDdYyyyHhMmA'
import AvaText from 'components/AvaText'
import Separator from 'components/Separator'

export const AddSubnetValidatorTxView = ({
  tx
}: {
  tx: AddSubnetValidatorTx
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { nodeID, start, end, subnetID } = tx
  const startDate = getDateInMmmDdYyyyHhMmA(parseInt(start))
  const endDate = getDateInMmmDdYyyyHhMmA(parseInt(end))

  return (
    <Card>
      <Row style={styles.rowContainer}>
        <AvaText.Caption color={colors.$neutral400}>Subnet ID</AvaText.Caption>
      </Row>
      <Space y={4} />
      <Row style={styles.rowContainer}>
        <AvaText.Caption color={colors.$neutral50}>
          {truncateNodeId(subnetID, 28)}
        </AvaText.Caption>
      </Row>
      <Space y={8} />
      <Row style={styles.rowContainer}>
        <AvaText.Caption color={colors.$neutral400}>Node ID</AvaText.Caption>
      </Row>
      <Space y={4} />
      <Row style={styles.rowContainer}>
        <AvaText.Caption color={colors.$neutral50}>{nodeID}</AvaText.Caption>
      </Row>
      <Separator style={styles.separator} color={colors.$neutral800} />
      <Row style={styles.rowCenterContainer}>
        <AvaText.Caption color={colors.$neutral50}>Start Date</AvaText.Caption>
        <AvaText.Subtitle2 color={colors.$neutral50}>
          {startDate.toLocaleString()}
        </AvaText.Subtitle2>
      </Row>
      <Space y={8} />
      <Row style={styles.rowCenterContainer}>
        <AvaText.Caption color={colors.$neutral50}>End Date</AvaText.Caption>
        <AvaText.Subtitle2 color={colors.$neutral50}>
          {endDate.toLocaleString()}
        </AvaText.Subtitle2>
      </Row>
    </Card>
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
