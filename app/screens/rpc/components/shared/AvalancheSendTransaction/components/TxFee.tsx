import React from 'react'
import { bigIntToString } from '@avalabs/utils-sdk'
import AvaText from 'components/AvaText'
import Card from 'components/Card'
import { Row } from 'components/Row'
import { Space } from 'components/Space'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'
import { selectAvaxPrice } from 'store/balance'
import { selectSelectedCurrency } from 'store/settings/currency'

const TxFee = ({ txFee }: { txFee: bigint }) => {
  const { theme } = useApplicationContext()
  const avaxPrice = useSelector(selectAvaxPrice)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { tokenInCurrencyFormatter } = useApplicationContext().appHook

  return (
    <>
      <AvaText.Body2 color={theme.colorText1} textStyle={{ lineHeight: 20 }}>
        Network Fee
      </AvaText.Body2>
      <Space y={8} />
      <Card style={styles.cardContainer}>
        <Row style={styles.rowContainer}>
          <AvaText.Caption color={theme.colorText1}>Fee Amount</AvaText.Caption>
          <View style={styles.feeContainer}>
            <AvaText.Subtitle2 color={theme.neutral50}>
              {Number(bigIntToString(txFee, 9))} AVAX
            </AvaText.Subtitle2>
            <Space y={2} />
            <AvaText.Caption color={theme.neutral400}>
              {`${tokenInCurrencyFormatter(
                Number(bigIntToString(txFee, 9)) * avaxPrice
              )} ${selectedCurrency}`}
            </AvaText.Caption>
          </View>
        </Row>
      </Card>
    </>
  )
}
const styles = StyleSheet.create({
  rowContainer: {
    justifyContent: 'space-between'
  },
  separator: {
    marginVertical: 16
  },
  feeContainer: {
    alignItems: 'flex-end'
  },
  cardContainer: {
    padding: 16
  }
})

export default TxFee
