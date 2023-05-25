import AvaText from 'components/AvaText'
import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import Separator from 'components/Separator'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Card from 'components/Card'
import AvaToken from 'components/svg/AvaToken'
import { bigIntToString } from '@avalabs/utils-sdk'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import AvaButton from 'components/AvaButton'
import CarrotSVG from 'components/svg/CarrotSVG'
import { getHexStringToBytes } from 'utils/getHexStringToBytes'
import { Avalanche } from '@avalabs/wallets-sdk'
import { AvalancheChainStrings } from 'store/walletConnect/handlers/types'

const ExportTxView = ({
  tx,
  avaxPrice,
  hexData,
  toggleActionButtons
}: {
  tx: Avalanche.ExportTx
  avaxPrice: number
  hexData: string
  toggleActionButtons: (value: boolean) => void
}) => {
  const { theme } = useApplicationContext()
  const [showData, setShowData] = useState(false)

  const { amount, chain, destination, type, txFee } = tx
  const { tokenInCurrencyFormatter } = useApplicationContext().appHook
  const selectedCurrency = useSelector(selectSelectedCurrency)

  const toggleShowRawData = (value: boolean) => {
    toggleActionButtons(value)
    setShowData(value)
  }

  if (showData) {
    return (
      <View style={{ padding: 16 }}>
        <Row style={{ alignItems: 'center' }}>
          <AvaButton.Base onPress={() => toggleShowRawData(false)}>
            <CarrotSVG direction={'left'} size={23} />
          </AvaButton.Base>
          <Space x={14} />
          <AvaText.Heading1>Transaction Data</AvaText.Heading1>
        </Row>
        <Space y={16} />
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body1>Hex Data:</AvaText.Body1>
          <AvaText.Body1>{getHexStringToBytes(hexData)} Bytes</AvaText.Body1>
        </Row>
        <View style={{ paddingVertical: 14 }}>
          <AvaText.Body1
            textStyle={{
              padding: 16,
              backgroundColor: theme.colorBg3,
              borderRadius: 15
            }}>
            {hexData}
          </AvaText.Body1>
        </View>
      </View>
    )
  }

  return (
    <View>
      <AvaText.Heading4>Approve Export</AvaText.Heading4>
      <Space y={24} />
      <Row style={styles.transactionContainer}>
        <AvaText.Body2 color={theme.colorText1} textStyle={{ lineHeight: 32 }}>
          Transaction Details
        </AvaText.Body2>
        <AvaButton.Base onPress={() => toggleShowRawData(true)}>
          <Row>
            <CarrotSVG color={theme.colorText1} direction={'left'} size={12} />
            <CarrotSVG color={theme.colorText1} size={12} />
          </Row>
        </AvaButton.Base>
      </Row>

      <Space y={8} />
      <Card style={styles.cardContainer}>
        <Row style={styles.rowContainer}>
          <AvaText.Caption color={theme.colorText1}>
            Source Chain
          </AvaText.Caption>
          <AvaText.Subtitle2 color={theme.colorText1}>
            Avalanche {AvalancheChainStrings[chain]}
          </AvaText.Subtitle2>
        </Row>
        <Space y={8} />
        <Row style={styles.rowContainer}>
          <AvaText.Caption color={theme.colorText1}>
            Target Chain
          </AvaText.Caption>
          <AvaText.Subtitle2 color={theme.colorText1}>
            Avalanche {AvalancheChainStrings[destination]}
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
          <AvaText.Caption color={theme.colorText1}>
            Transaction Type
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
            <AvaText.Caption color={theme.neutral400}>
              {`${tokenInCurrencyFormatter(
                Number(bigIntToString(amount, 9)) * avaxPrice
              )} ${selectedCurrency}`}
            </AvaText.Caption>
          </View>
        </Row>
      </Card>

      <Space y={16} />
      <AvaText.Body2 color={theme.colorText1} textStyle={{ lineHeight: 20 }}>
        Network fee
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
  transactionContainer: {
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
  cardContainer: {
    padding: 16
  }
})
export default ExportTxView
