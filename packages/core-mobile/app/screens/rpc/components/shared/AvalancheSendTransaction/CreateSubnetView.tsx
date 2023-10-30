import AvaText from 'components/AvaText'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Card from 'components/Card'
import { Avalanche } from '@avalabs/wallets-sdk'
import TxFee from './components/TxFee'

const CreateSubnetTxView = ({ tx }: { tx: Avalanche.CreateSubnetTx }) => {
  const { theme } = useApplicationContext()
  const { txFee, threshold, controlKeys } = tx

  return (
    <View>
      <AvaText.Heading4>Approve Create Subnet</AvaText.Heading4>
      <Space y={28} />
      <AvaText.Body2 color={theme.colorText1} textStyle={{ lineHeight: 20 }}>
        Subnet Details
      </AvaText.Body2>
      <Space y={8} />
      <Card style={styles.cardContainer}>
        <Row style={styles.rowContainer}>
          <AvaText.Caption color={theme.colorText2}>
            {controlKeys.length > 1 ? 'Owners' : 'Owner'}
          </AvaText.Caption>
        </Row>
        <Space y={4} />
        {controlKeys.map((controlKey, i) => (
          <Row style={styles.rowContainer} key={i}>
            <AvaText.Caption color={theme.colorText1}>
              {controlKey}
            </AvaText.Caption>
          </Row>
        ))}
        <Space y={8} />
        {controlKeys.length > 1 && (
          <>
            <Row style={styles.rowContainer}>
              <AvaText.Caption color={theme.colorText2}>
                Signature Threshold
              </AvaText.Caption>
            </Row>
            <Space y={4} />
            <Row style={styles.rowContainer}>
              <AvaText.Caption color={theme.colorText1}>
                {threshold}/{controlKeys.length}
              </AvaText.Caption>
            </Row>
          </>
        )}
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
  cardContainer: {
    padding: 16
  }
})

export default CreateSubnetTxView
