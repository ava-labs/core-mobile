import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useTheme, View } from '@avalabs/k2-mobile'
import { ExportTx } from '@avalabs/vm-module-types'
import AvaText from 'components/AvaText'
import Card from 'components/Card'
import { Row } from 'components/Row'
import Separator from 'components/Separator'
import { Space } from 'components/Space'
import AvaToken from 'components/svg/AvaToken'
import { useApplicationContext } from 'contexts/ApplicationContext'
import React from 'react'
import { useSelector } from 'react-redux'
import NetworkService from 'services/network/NetworkService'
import { selectAvaxPrice } from 'store/balance'
import { AvalancheChainStrings } from 'store/rpc/handlers/types'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectSelectedCurrency } from 'store/settings/currency'

export const ExportTxView = ({ tx }: { tx: ExportTx }): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const avaxPrice = useSelector(selectAvaxPrice)
  const { amount, chain, destination, type } = tx
  const { tokenInCurrencyFormatter } = useApplicationContext().appHook
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const pNetwork = NetworkService.getAvalancheNetworkP(isDeveloperMode)
  const exportAmount = new TokenUnit(
    amount,
    pNetwork.networkToken.decimals,
    pNetwork.networkToken.symbol
  )

  return (
    <>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Caption color={colors.$neutral50}>
            Source Chain
          </AvaText.Caption>
          <AvaText.Subtitle2 color={colors.$neutral50}>
            Avalanche {AvalancheChainStrings[chain]}
          </AvaText.Subtitle2>
        </Row>
        <Space y={8} />
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Caption color={colors.$neutral50}>
            Target Chain
          </AvaText.Caption>
          <AvaText.Subtitle2 color={colors.$neutral50}>
            Avalanche {AvalancheChainStrings[destination]}
          </AvaText.Subtitle2>
        </Row>
      </Card>

      <Space y={16} />
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Caption color={colors.$neutral50}>
            Transaction Type
          </AvaText.Caption>
          <AvaText.Subtitle2 color={colors.$neutral50}>
            {type ? (type[0] || '').toUpperCase() + type.slice(1) : ''}
          </AvaText.Subtitle2>
        </Row>
        <Separator style={{ marginVertical: 16 }} color={colors.$neutral700} />
        <Row style={{ justifyContent: 'space-between' }}>
          <Row style={{ alignItems: 'center' }}>
            <AvaToken color={colors.$avalancheRed} />
            <Space x={16} />
            <AvaText.Heading3>AVAX</AvaText.Heading3>
          </Row>
          <View style={{ alignItems: 'flex-end' }}>
            <AvaText.Subtitle2 color={colors.$neutral50}>
              {exportAmount.toDisplay()} AVAX
            </AvaText.Subtitle2>
            <Space y={2} />
            <AvaText.Caption color={colors.$neutral400}>
              {`${tokenInCurrencyFormatter(
                exportAmount.mul(avaxPrice).toDisplay()
              )} ${selectedCurrency}`}
            </AvaText.Caption>
          </View>
        </Row>
      </Card>
    </>
  )
}
