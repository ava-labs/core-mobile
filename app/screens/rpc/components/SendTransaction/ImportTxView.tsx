import AvaText from 'components/AvaText'
import React from 'react'
import { View } from 'react-native'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import Separator from 'components/Separator'
import { ImportTx } from 'store/walletConnect/handlers/types'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { AvalancheChainStrings } from 'store/walletConnect/handlers/utils/parseAvalancheTx'
import Card from 'components/Card'
import AvaToken from 'components/svg/AvaToken'
import { bigIntToString } from '@avalabs/utils-sdk'

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

  return (
    <View>
      <AvaText.Heading2>Approve Import</AvaText.Heading2>
      <Space y={16} />
      <AvaText.Body2
        color={theme.colorText1}
        textStyle={{ fontFamily: 'Inter-SemiBold' }}>
        Chain: {AvalancheChainStrings[chain]}
      </AvaText.Body2>
      <Space y={8} />
      <Card style={{ padding: 16 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body3>Source chain</AvaText.Body3>
          <AvaText.Body3>{AvalancheChainStrings[source]}</AvaText.Body3>
        </Row>
        <Space y={8} />
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body3>Target chain</AvaText.Body3>
          <AvaText.Body3>{AvalancheChainStrings[chain]}</AvaText.Body3>
        </Row>
      </Card>

      <Space y={16} />
      <AvaText.Body2
        color={theme.colorText1}
        textStyle={{ fontFamily: 'Inter-SemiBold' }}>
        Token
      </AvaText.Body2>
      <Space y={8} />
      <Card style={{ padding: 16 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body3>Transaction type</AvaText.Body3>
          <AvaText.Body3>
            {type ? (type[0] || '').toUpperCase() + type.slice(1) : ''}
          </AvaText.Body3>
        </Row>
        <Separator style={{ marginVertical: 8 }} />
        <Row style={{ justifyContent: 'space-between' }}>
          <Row style={{ alignItems: 'center' }}>
            <AvaToken color={theme.tokenLogoBg} />
            <Space x={16} />
            <AvaText.Heading3>AVAX</AvaText.Heading3>
          </Row>
          <View style={{ alignItems: 'flex-end' }}>
            <AvaText.Body2 color={theme.white}>
              {Number(bigIntToString(amount, 9))} AVAX
            </AvaText.Body2>
            <Space y={2} />
            <AvaText.Body3 color={theme.colorText2}>
              {tokenInCurrencyFormatter(
                Number(bigIntToString(amount, 9)) * avaxPrice
              )}
            </AvaText.Body3>
          </View>
        </Row>
      </Card>

      <Space y={16} />
      <AvaText.Body2
        color={theme.colorText1}
        textStyle={{ fontFamily: 'Inter-SemiBold' }}>
        Network fee
      </AvaText.Body2>
      <Space y={8} />
      <Card style={{ padding: 16 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body3>Fee Amount</AvaText.Body3>
          <View style={{ alignItems: 'flex-end' }}>
            <AvaText.Body2 color={theme.white}>
              {Number(bigIntToString(txFee, 9))} AVAX
            </AvaText.Body2>
            <Space y={2} />
            <AvaText.Body3 color={theme.colorText2}>
              {tokenInCurrencyFormatter(
                Number(bigIntToString(txFee, 9)) * avaxPrice
              )}
            </AvaText.Body3>
          </View>
        </Row>
      </Card>
    </View>
  )
}
export default ExportTxView
