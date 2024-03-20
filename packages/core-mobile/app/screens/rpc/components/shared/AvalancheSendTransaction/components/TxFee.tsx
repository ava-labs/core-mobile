import React from 'react'
import { bigIntToString } from '@avalabs/utils-sdk'
import Card from 'components/Card'
import { Row } from 'components/Row'
import { Space } from 'components/Space'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'
import { selectAvaxPrice } from 'store/balance'
import { selectSelectedCurrency } from 'store/settings/currency'
import { Text } from '@avalabs/k2-mobile'

export const TxFee = ({ txFee }: { txFee: bigint }): JSX.Element => {
  const avaxPrice = useSelector(selectAvaxPrice)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { tokenInCurrencyFormatter } = useApplicationContext().appHook

  return (
    <>
      <Text variant="body2" sx={{ color: '$neutral50' }}>
        Network Fee
      </Text>
      <Space y={8} />
      <Card style={styles.cardContainer}>
        <Row style={styles.rowContainer}>
          <Text variant="caption" sx={{ color: '$neutral400' }}>
            Fee Amount
          </Text>
          <View style={styles.feeContainer}>
            <Text variant="subtitle2" sx={{ color: '$neutral50' }}>
              {Number(bigIntToString(txFee, 9))} AVAX
            </Text>
            <Space y={2} />
            <Text variant="caption" sx={{ color: '$neutral400' }}>
              {`${tokenInCurrencyFormatter(
                Number(bigIntToString(txFee, 9)) * avaxPrice
              )} ${selectedCurrency}`}
            </Text>
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
