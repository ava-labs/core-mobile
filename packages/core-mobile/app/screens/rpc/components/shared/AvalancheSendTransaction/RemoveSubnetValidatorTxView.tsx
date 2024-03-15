import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import Card from 'components/Card'
import { truncateNodeId } from 'utils/Utils'
import { Text } from '@avalabs/k2-mobile'
import CopySVG from 'components/svg/CopySVG'
import { copyToClipboard } from 'utils/DeviceTools'
import AvaButton from 'components/AvaButton'
import { RemoveSubnetValidatorTx } from './types'
import { TxFee } from './components/TxFee'

export const RemoveSubnetValidatorTxView = ({
  tx
}: {
  tx: RemoveSubnetValidatorTx
}): JSX.Element => {
  const { nodeID, txFee, subnetID } = tx

  return (
    <View>
      <Text variant="heading4">Remove Subnet Validator</Text>
      <Space y={28} />
      <Text variant="body2" sx={{ color: '$neutral50' }}>
        Staking Details
      </Text>
      <Space y={8} />
      <Card style={styles.cardContainer}>
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
  currencyContainer: {
    justifyContent: 'flex-end'
  },
  cardContainer: {
    padding: 16
  }
})
