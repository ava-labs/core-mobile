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
      <AvaText.Heading4>Approve Import</AvaText.Heading4>
      <Space y={28} />
      <AvaText.TextLink color={theme.colorText1} textStyle={{ lineHeight: 20 }}>
        Chain Details
      </AvaText.TextLink>
      <Space y={8} />
      <Card style={{ padding: 16 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Caption color={theme.colorText2}>
            Source Chain
          </AvaText.Caption>
          <AvaText.Caption color={theme.colorText1}>
            Avalanche {AvalancheChainStrings[source]}
          </AvaText.Caption>
        </Row>
        <Space y={8} />
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Caption color={theme.colorText2}>
            Destination Chain
          </AvaText.Caption>
          <AvaText.Caption color={theme.colorText1}>
            Avalanche {AvalancheChainStrings[chain]}
          </AvaText.Caption>
        </Row>
      </Card>

      <Space y={32} />
      <AvaText.TextLink color={theme.colorText1} textStyle={{ lineHeight: 20 }}>
        Balance Change
      </AvaText.TextLink>
      <Space y={8} />
      <Card style={{ padding: 16 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Caption color={theme.colorText2}>
            Transaction type
          </AvaText.Caption>
          <AvaText.Caption color={theme.colorText1}>
            {type ? (type[0] || '').toUpperCase() + type.slice(1) : ''}
          </AvaText.Caption>
        </Row>
        <Separator style={{ marginVertical: 16 }} color={theme.neutral800} />
        <Row style={{ justifyContent: 'space-between' }}>
          <Row style={{ alignItems: 'center' }}>
            <AvaToken color={theme.tokenLogoBg} />
            <Space x={16} />
            <AvaText.Heading3>AVAX</AvaText.Heading3>
          </Row>
          <View style={{ alignItems: 'flex-end' }}>
            <AvaText.Subtitle2 color={theme.white}>
              {Number(bigIntToString(amount, 9))} AVAX
            </AvaText.Subtitle2>
            <Space y={2} />
            <AvaText.Body3 color={theme.neutral400}>
              {tokenInCurrencyFormatter(
                Number(bigIntToString(amount, 9)) * avaxPrice
              )}
            </AvaText.Body3>
          </View>
        </Row>
      </Card>

      <Space y={24} />
      <AvaText.TextLink color={theme.colorText1} textStyle={{ lineHeight: 20 }}>
        Network fee
      </AvaText.TextLink>
      <Space y={8} />
      <Card style={{ padding: 16 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body3 color={theme.neutral400}>Fee Amount</AvaText.Body3>
          <View style={{ alignItems: 'flex-end' }}>
            <AvaText.Subtitle2 color={theme.neutral50}>
              {Number(bigIntToString(txFee, 9))} AVAX
            </AvaText.Subtitle2>
            <Space y={2} />
            <AvaText.Body3 color={theme.neutral400}>
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
