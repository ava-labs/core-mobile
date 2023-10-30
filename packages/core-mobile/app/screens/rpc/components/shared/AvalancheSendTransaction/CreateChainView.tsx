import AvaText from 'components/AvaText'
import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Card from 'components/Card'
import Separator from 'components/Separator'
import { Avalanche } from '@avalabs/wallets-sdk'
import AvaButton from 'components/AvaButton'
import CarrotSVG from 'components/svg/CarrotSVG'
import TxFee from './components/TxFee'

const CreateChainTxView = ({ tx }: { tx: Avalanche.CreateChainTx }) => {
  const { theme } = useApplicationContext()
  const { txFee, chainID, chainName, vmID, genesisData } = tx
  const [showGenesis, setShowGenesis] = useState<boolean>(false)

  if (showGenesis) {
    return (
      <View>
        <Row style={{ alignItems: 'center' }}>
          <AvaButton.Base onPress={() => setShowGenesis(false)}>
            <CarrotSVG direction={'left'} size={23} />
          </AvaButton.Base>
          <Space x={14} />
          <AvaText.Heading1>Genesis Data</AvaText.Heading1>
        </Row>
        <Space y={16} />
        <View style={{ paddingVertical: 14 }}>
          <AvaText.Body1
            textStyle={{
              padding: 16,
              backgroundColor: theme.colorBg3,
              borderRadius: 15
            }}>
            {genesisData}
          </AvaText.Body1>
        </View>
      </View>
    )
  }

  return (
    <View>
      <AvaText.Heading4>Approve Create Chain</AvaText.Heading4>
      <Space y={28} />
      <AvaText.Body2 color={theme.colorText1} textStyle={{ lineHeight: 20 }}>
        Blockchain Details
      </AvaText.Body2>
      <Space y={8} />
      <Card style={styles.cardContainer}>
        <Row style={styles.rowContainer}>
          <AvaText.Caption color={theme.colorText2}>
            Blockchain Name
          </AvaText.Caption>
        </Row>
        <Space y={4} />
        <Row style={styles.rowContainer}>
          <AvaText.Caption color={theme.colorText1}>
            {chainName}
          </AvaText.Caption>
        </Row>
        <Space y={8} />
        <Row style={styles.rowContainer}>
          <AvaText.Caption color={theme.colorText2}>
            Blockchain ID
          </AvaText.Caption>
        </Row>
        <Space y={4} />
        <Row style={styles.rowContainer}>
          <AvaText.Caption color={theme.colorText1}>{chainID}</AvaText.Caption>
        </Row>
        <Space y={8} />
        <Row style={styles.rowContainer}>
          <AvaText.Caption color={theme.colorText2}>
            Virtual Machine ID
          </AvaText.Caption>
        </Row>
        <Space y={4} />
        <Row style={styles.rowContainer}>
          <AvaText.Caption color={theme.colorText1}>{vmID}</AvaText.Caption>
        </Row>
        <Separator style={styles.separator} color={theme.neutral800} />
        <Row style={styles.rowContainer}>
          <AvaText.Caption color={theme.colorText2}>
            Genesis File
          </AvaText.Caption>
        </Row>
        <Space y={4} />
        <Row style={styles.rowContainer}>
          <AvaButton.TextMedium
            style={{
              paddingHorizontal: 0,
              paddingVertical: 0
            }}
            onPress={() => setShowGenesis(true)}>
            View
          </AvaButton.TextMedium>
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
  separator: {
    marginVertical: 16
  },
  cardContainer: {
    padding: 16
  }
})

export default CreateChainTxView
