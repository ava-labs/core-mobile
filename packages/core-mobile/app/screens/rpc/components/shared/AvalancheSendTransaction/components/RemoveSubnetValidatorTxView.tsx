import React from 'react'
import { Text } from '@avalabs/k2-mobile'
import { RemoveSubnetValidatorTx } from '@avalabs/vm-module-types'
import { Space } from 'components/Space'
import Card from 'components/Card'
import { StyleSheet } from 'react-native'
import { Row } from 'components/Row'
import AvaButton from 'components/AvaButton'
import { copyToClipboard } from 'utils/DeviceTools'
import CopySVG from 'components/svg/CopySVG'
import { truncateNodeId } from 'utils/Utils'

export const RemoveSubnetValidatorTxView = ({
  tx
}: {
  tx: RemoveSubnetValidatorTx
}): React.JSX.Element => {
  const { nodeID, subnetID } = tx

  return (
    <Card>
      <Row style={styles.rowContainer}>
        <Text variant="caption" sx={{ color: '$neutral400' }}>
          Node ID
        </Text>
        <AvaButton.TextWithIcon
          textStyle={{ textAlign: 'left' }}
          onPress={() => copyToClipboard(nodeID)}
          icon={<CopySVG />}
          iconPlacement="right"
          text={
            <Text variant="caption" sx={{ color: '$neutral50' }}>
              {truncateNodeId(nodeID)}
            </Text>
          }
        />
      </Row>
      <Space y={8} />
      <Row style={styles.rowContainer}>
        <Text variant="caption" sx={{ color: '$neutral400' }}>
          Subnet ID
        </Text>
        <AvaButton.TextWithIcon
          textStyle={{ textAlign: 'left' }}
          onPress={() => copyToClipboard(subnetID)}
          icon={<CopySVG />}
          iconPlacement="right"
          text={
            <Text variant="caption" sx={{ color: '$neutral50' }}>
              {truncateNodeId(subnetID)}
            </Text>
          }
        />
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
  currencyContainer: {
    justifyContent: 'flex-end'
  }
})
