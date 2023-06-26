import AvaText from 'components/AvaText'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Card from 'components/Card'
import { Avalanche } from '@avalabs/wallets-sdk'
import { bigIntToString } from '@avalabs/utils-sdk'
import { selectAvaxPrice } from 'store/balance'
import { useSelector } from 'react-redux'

const CreateSubnetTxView = ({ tx }: { tx: Avalanche.CreateSubnetTx }) => {
  const { theme } = useApplicationContext()
  const { currencyFormatter } = useApplicationContext().appHook
  const avaxPrice = useSelector(selectAvaxPrice)
  const { txFee, threshold, controlKeys } = tx
  const txFeeNumber = Number(bigIntToString(txFee, 9))

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

export default CreateSubnetTxView
