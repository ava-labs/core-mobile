import React from 'react'

import { useSelector } from 'react-redux'
import { selectAvaxPrice } from 'store/balance'
import { AvalancheChainStrings } from 'store/rpc/handlers/types'
import { ImportTx } from '@avalabs/vm-module-types'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { selectSelectedCurrency } from 'store/settings/currency'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import NetworkService from 'services/network/NetworkService'
import Card from 'components/Card'
import { Row } from 'components/Row'
import AvaText from 'components/AvaText'
import { useTheme, View } from '@avalabs/k2-mobile'
import { Space } from 'components/Space'
import Separator from 'components/Separator'
import AvaToken from 'components/svg/AvaToken'

export const ImportTxView = ({ tx }: { tx: ImportTx }): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const avaxPrice = useSelector(selectAvaxPrice)
  const { amount, chain, source, type } = tx
  const { tokenInCurrencyFormatter } = useApplicationContext().appHook
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const pNetwork = NetworkService.getAvalancheNetworkP(isDeveloperMode)
  const importAmount = new TokenUnit(
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
            Avalanche {AvalancheChainStrings[source]}
          </AvaText.Subtitle2>
        </Row>
        <Space y={8} />
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Caption color={colors.$neutral50}>
            Destination Chain
          </AvaText.Caption>
          <AvaText.Subtitle2 color={colors.$neutral50}>
            Avalanche {AvalancheChainStrings[chain]}
          </AvaText.Subtitle2>
        </Row>
      </Card>

      <Space y={16} />
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Caption color={colors.$neutral50}>
            Transaction type
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
              {importAmount.toDisplay()} AVAX
            </AvaText.Subtitle2>
            <Space y={2} />
            <AvaText.Body3 color={colors.$neutral400}>
              {`${tokenInCurrencyFormatter(
                importAmount.mul(avaxPrice).toDisplay()
              )} ${selectedCurrency}`}
            </AvaText.Body3>
          </View>
        </Row>
      </Card>
    </>
  )
}
