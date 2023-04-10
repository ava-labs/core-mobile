import AvaText from 'components/AvaText'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import Separator from 'components/Separator'
import { ImportTx } from 'store/walletConnect/handlers/types'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { AvalancheChainStrings } from 'store/walletConnect/handlers/utils/parseAvalancheTx'
import Card from 'components/Card'
import AvaToken from 'components/svg/AvaToken'
import { bigIntToString } from '@avalabs/utils-sdk'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'

const ExportTxView = ({
  tx,
  avaxPrice
}: {
  tx: ImportTx
  avaxPrice: number
}) => {
  const { theme } = useApplicationContext()
  const { amount, chain, source, type, txFee } = tx
  const { tokenInCurrencyFormatter } = useApplicationContext().appHook
  const selectedCurrency = useSelector(selectSelectedCurrency)

  return (
    <View>
      <AvaText.Heading4>Approve Import</AvaText.Heading4>
      <Space y={24} />
      <AvaText.Body2 color={theme.colorText1} textStyle={{ lineHeight: 32 }}>
        Transaction Details
      </AvaText.Body2>
      <Space y={8} />
      <Card style={styles.cardContainer}>
        <Row style={styles.rowContainer}>
          <AvaText.Caption color={theme.colorText1}>
            Source Chain
          </AvaText.Caption>
          <AvaText.Subtitle2 color={theme.colorText1}>
            Avalanche {AvalancheChainStrings[source]}
          </AvaText.Subtitle2>
        </Row>
        <Space y={8} />
        <Row style={styles.rowContainer}>
          <AvaText.Caption color={theme.colorText1}>
            Destination Chain
          </AvaText.Caption>
          <AvaText.Subtitle2 color={theme.colorText1}>
            Avalanche {AvalancheChainStrings[chain]}
          </AvaText.Subtitle2>
        </Row>
      </Card>

      <Space y={16} />
      <AvaText.Body2 color={theme.colorText1} textStyle={{ lineHeight: 20 }}>
        Balance Change
      </AvaText.Body2>
      <Space y={8} />
      <Card style={styles.cardContainer}>
        <Row style={styles.rowContainer}>
          <AvaText.Caption color={theme.colorText2}>
            Transaction type
          </AvaText.Caption>
          <AvaText.Subtitle2 color={theme.colorText1}>
            {type ? (type[0] || '').toUpperCase() + type.slice(1) : ''}
          </AvaText.Subtitle2>
        </Row>
        <Separator style={styles.separator} color={theme.neutral800} />
        <Row style={styles.rowContainer}>
          <Row style={styles.innerRow}>
            <AvaToken color={theme.tokenLogoBg} />
            <Space x={16} />
            <AvaText.Heading3>AVAX</AvaText.Heading3>
          </Row>
          <View style={styles.feeContainer}>
            <AvaText.Subtitle2 color={theme.colorText1}>
              {Number(bigIntToString(amount, 9))} AVAX
            </AvaText.Subtitle2>
            <Space y={2} />
            <AvaText.Body3 color={theme.neutral400}>
              {`${tokenInCurrencyFormatter(
                Number(bigIntToString(amount, 9)) * avaxPrice
              )} ${selectedCurrency}`}
            </AvaText.Body3>
          </View>
        </Row>
      </Card>

      <Space y={16} />
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
    </View>
  )
}

const styles = StyleSheet.create({
  rowContainer: {
    justifyContent: 'space-between'
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
  cardContainer: {
    padding: 16
  }
})

export default ExportTxView
