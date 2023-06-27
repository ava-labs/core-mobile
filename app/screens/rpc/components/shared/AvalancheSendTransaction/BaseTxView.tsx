import AvaText from 'components/AvaText'
import React from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Card from 'components/Card'
import { bigIntToString } from '@avalabs/utils-sdk'
import { GetAssetDescriptionResponse } from '@avalabs/avalanchejs-v2/dist/src/vms/common'

import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import Separator from 'components/Separator'
import { truncateAddress } from 'utils/Utils'
import { Avalanche } from '@avalabs/wallets-sdk'
import { AvalancheChainStrings } from 'store/walletConnect/handlers/types'
import { selectAvaxPrice } from 'store/balance'

const BaseTxView = ({ tx }: { tx: Avalanche.BaseTx }) => {
  const { theme } = useApplicationContext()
  const avaxPrice = useSelector(selectAvaxPrice)
  const { chain, txFee, outputs, memo } = tx
  const { tokenInCurrencyFormatter } = useApplicationContext().appHook
  const selectedCurrency = useSelector(selectSelectedCurrency)

  const renderOutputCard = (output: {
    assetId: string
    locktime: bigint
    threshold: bigint
    amount: bigint
    assetDescription?: GetAssetDescriptionResponse
    owners: string[]
    isAvax: boolean
  }) => {
    return (
      <Card key={output.assetId} style={styles.balanceCardContainer}>
        {output.owners.map(address => (
          <Row style={styles.rowContainer}>
            <AvaText.Caption color={theme.colorText1}>To</AvaText.Caption>
            <AvaText.Body2 color={theme.colorText1}>
              {truncateAddress(address)}
            </AvaText.Body2>
          </Row>
        ))}
        <Separator style={styles.separator} color={theme.neutral800} />
        <Row style={styles.rowContainer}>
          <AvaText.Caption color={theme.colorText1}>Amount</AvaText.Caption>
          <AvaText.Subtitle2 color={theme.colorText1}>
            {`${Number(
              bigIntToString(
                output.amount,
                output.assetDescription?.denomination || 0
              )
            )} AVAX`}
          </AvaText.Subtitle2>
        </Row>
        {output.owners.length > 1 && (
          <Row style={styles.rowContainer}>
            <AvaText.Caption color={theme.colorText1}>
              Threshold
            </AvaText.Caption>
            <AvaText.Body2 color={theme.colorText1}>
              {output.threshold.toString()}
            </AvaText.Body2>
          </Row>
        )}
      </Card>
    )
  }

  return (
    <ScrollView style={{ maxHeight: 450 }}>
      <AvaText.Heading4>Approve Transaction</AvaText.Heading4>
      <Space y={24} />
      <AvaText.Body2 color={theme.colorText1} textStyle={{ lineHeight: 32 }}>
        Chain Details
      </AvaText.Body2>
      <Space y={8} />
      <Card style={styles.cardContainer}>
        <Row style={styles.rowContainer}>
          <AvaText.Caption color={theme.colorText1}>
            Active chain
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
      {outputs.map(output => renderOutputCard(output))}
      <Space y={16} />
      <AvaText.Body2 color={theme.colorText1} textStyle={{ lineHeight: 20 }}>
        Network fee
      </AvaText.Body2>
      <Space y={8} />
      <Card style={styles.cardContainer}>
        <Row style={styles.rowContainer}>
          <AvaText.Caption color={theme.colorText1}>Fee Amount</AvaText.Caption>
          <View style={styles.feeContainer}>
            <AvaText.Subtitle2 color={theme.white}>
              {Number(bigIntToString(txFee, 9))} AVAX
            </AvaText.Subtitle2>
            <Space y={2} />
            <AvaText.Caption color={theme.colorText2}>
              {`${tokenInCurrencyFormatter(
                Number(bigIntToString(txFee, 9)) * avaxPrice
              )} ${selectedCurrency}`}
            </AvaText.Caption>
          </View>
        </Row>
      </Card>
      <Space y={16} />
      <AvaText.Body2 color={theme.colorText1}>Memo</AvaText.Body2>
      <Space y={8} />
      <Card style={styles.cardContainer}>
        <AvaText.Caption color={theme.colorText2}>{memo}</AvaText.Caption>
      </Card>
    </ScrollView>
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
  },
  balanceCardContainer: {
    padding: 16,
    marginBottom: 8
  }
})

export default BaseTxView
