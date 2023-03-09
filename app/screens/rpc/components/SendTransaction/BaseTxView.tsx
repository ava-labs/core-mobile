import AvaText from 'components/AvaText'
import React from 'react'
import { View } from 'react-native'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import { AvalancheBaseTx } from 'store/walletConnect/handlers/types'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { AvalancheChainStrings } from 'store/walletConnect/handlers/utils/parseAvalancheTx'
import Card from 'components/Card'
import AvaToken from 'components/svg/AvaToken'
import { bigIntToString } from '@avalabs/utils-sdk'
import { GetAssetDescriptionResponse } from '@avalabs/avalanchejs-v2/dist/src/vms/common'
import { Avalanche } from '@avalabs/wallets-sdk'

const BaseTxView = ({
  tx,
  avaxPrice
}: {
  tx: AvalancheBaseTx
  avaxPrice: number
}) => {
  const { theme } = useApplicationContext()
  const { chain, txFee, outputs, memo } = tx
  const { tokenInCurrencyFormatter } = useApplicationContext().appHook

  const isDateFuture = (date: bigint) => {
    const now = Avalanche.getUnixNow()
    return date > now
  }

  const unixToLocaleString = (date: bigint) => {
    return new Date(Number(date.toString()) * 1000).toLocaleString()
  }

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
      <Card key={output.assetId} style={{ padding: 16 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Row style={{ alignItems: 'center' }}>
            {output.isAvax && <AvaToken color={theme.tokenLogoBg} />}
            <Space x={16} />
            <AvaText.Heading3>
              {output.assetDescription?.symbol}
            </AvaText.Heading3>
          </Row>
          <View style={{ alignItems: 'flex-end' }}>
            <AvaText.Body2 color={theme.white}>
              {Number(
                bigIntToString(
                  output.amount,
                  output.assetDescription?.denomination || 0
                )
              )}
            </AvaText.Body2>
            <Space y={2} />
            {output.isAvax && (
              <AvaText.Body3 color={theme.colorText2}>
                {tokenInCurrencyFormatter(
                  Number(
                    bigIntToString(
                      output.amount,
                      output.assetDescription?.denomination || 0
                    )
                  ) * avaxPrice
                )}
              </AvaText.Body3>
            )}
          </View>
        </Row>
        {isDateFuture(output.locktime) && (
          <Row style={{ justifyContent: 'space-between' }}>
            <AvaText.Body3 color={theme.colorText2}>Locktime</AvaText.Body3>
            <AvaText.Body2>{unixToLocaleString(output.locktime)}</AvaText.Body2>
          </Row>
        )}
        {output.owners.length > 1 && (
          <Row style={{ justifyContent: 'space-between' }}>
            <AvaText.Body3 color={theme.colorText2}>Threshold</AvaText.Body3>
            <AvaText.Body2>{output.threshold.toString()}</AvaText.Body2>
          </Row>
        )}
        <View>
          <AvaText.Body1>Recipients</AvaText.Body1>
          {output.owners.map(address => (
            <AvaText.Body3 color={theme.colorText2}>{address}</AvaText.Body3>
          ))}
        </View>
      </Card>
    )
  }

  return (
    <View>
      <AvaText.Heading2>Approve Transaction</AvaText.Heading2>
      <Space y={16} />
      <Card style={{ padding: 16 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body3>Source chain</AvaText.Body3>
          <AvaText.Body3>{AvalancheChainStrings[chain]}</AvaText.Body3>
        </Row>
      </Card>

      <Space y={16} />
      <AvaText.Body2
        color={theme.colorText1}
        textStyle={{ fontFamily: 'Inter-SemiBold' }}>
        Details
      </AvaText.Body2>
      <Space y={8} />
      {outputs.map(output => renderOutputCard(output))}

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

      <Space y={16} />
      <AvaText.Body2
        color={theme.colorText1}
        textStyle={{ fontFamily: 'Inter-SemiBold' }}>
        Memo
      </AvaText.Body2>
      <Space y={8} />
      <Card style={{ padding: 16 }}>
        <AvaText.Body3 color={theme.colorText2}>{memo}</AvaText.Body3>
      </Card>
    </View>
  )
}

export default BaseTxView
