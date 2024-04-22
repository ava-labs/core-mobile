import AvaText from 'components/AvaText'
import React from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Card from 'components/Card'
import Separator from 'components/Separator'
import { truncateAddress } from 'utils/Utils'
import { Avalanche } from '@avalabs/wallets-sdk'
import { AvalancheChainStrings } from 'store/rpc/handlers/types'
import { GetAssetDescriptionResponse } from '@avalabs/avalanchejs/dist/vms/common'
import { Avax } from 'types'
import { TxFee } from './components/TxFee'

const BaseTxView = ({ tx }: { tx: Avalanche.BaseTx }): JSX.Element => {
  const { theme } = useApplicationContext()
  const { chain, txFee, outputs, memo } = tx

  const renderOutputCard = (output: {
    assetId: string
    locktime: bigint
    threshold: bigint
    amount: bigint
    assetDescription?: GetAssetDescriptionResponse
    owners: string[]
    isAvax: boolean
  }): JSX.Element => {
    return (
      <Card key={output.assetId} style={styles.balanceCardContainer}>
        {output.owners.map(address => (
          <Row key={address} style={styles.rowContainer}>
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
            {`${Avax.fromNanoAvax(output.amount).toDisplay(6)} AVAX`}
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
      <TxFee txFee={txFee} />
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
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  separator: {
    marginVertical: 16
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
