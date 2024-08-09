import { truncateAddress } from '@avalabs/core-utils-sdk'
import { Text, useTheme } from '@avalabs/k2-mobile'
import { BaseTx } from '@avalabs/vm-module-types'
import Card from 'components/Card'
import { Row } from 'components/Row'
import React from 'react'
import AvaText from 'components/AvaText'
import Separator from 'components/Separator'
import { StyleSheet } from 'react-native'
import { Avax } from 'types'
import { AvalancheChainStrings } from 'store/rpc/handlers/types'
import { Space } from 'components/Space'
import { Common, PVM } from '@avalabs/avalanchejs'
import CopySVG from 'components/svg/CopySVG'
import { copyToClipboard } from 'utils/DeviceTools'
import AvaButton from 'components/AvaButton'

export const BaseTxView = ({ tx }: { tx: BaseTx }): React.JSX.Element => {
  const { chain, outputs, memo } = tx
  const {
    theme: { colors }
  } = useTheme()

  const renderOutputCard = (output: {
    assetId: string
    locktime: bigint
    threshold: bigint
    amount: bigint
    assetDescription?: Common.GetAssetDescriptionResponse
    owners: string[]
    isAvax: boolean
  }): JSX.Element => {
    return (
      <Card
        key={output.assetId}
        style={{
          ...styles.balanceCardContainer,
          backgroundColor: colors.$neutral800
        }}>
        {output.owners.map(address => (
          <Row key={address} style={styles.rowContainer}>
            <AvaText.Caption color={colors.$neutral50}>To</AvaText.Caption>
            <AvaButton.TextWithIcon
              textStyle={{ textAlign: 'left' }}
              onPress={() => copyToClipboard(address)}
              icon={<CopySVG />}
              iconPlacement="right"
              text={
                <AvaText.Body2 color={colors.$neutral50}>
                  {truncateAddress(address)}
                </AvaText.Body2>
              }
            />
          </Row>
        ))}
        <Separator style={styles.separator} color={colors.$neutral700} />
        <Row style={styles.rowContainer}>
          <AvaText.Caption color={colors.$neutral50}>Amount</AvaText.Caption>
          <AvaText.Subtitle2 color={colors.$neutral50}>
            {`${Avax.fromNanoAvax(output.amount).toDisplay(6)} AVAX`}
          </AvaText.Subtitle2>
        </Row>
        {output.owners.length > 1 && (
          <Row style={styles.rowContainer}>
            <AvaText.Caption color={colors.$neutral50}>
              Threshold
            </AvaText.Caption>
            <AvaText.Body2 color={colors.$neutral50}>
              {output.threshold.toString()}
            </AvaText.Body2>
          </Row>
        )}
      </Card>
    )
  }

  return (
    <>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="buttonMedium">Chain Details</Text>
      </Row>
      <Card
        style={{
          ...styles.cardContainer,
          backgroundColor: colors.$neutral800
        }}>
        <Row style={styles.rowContainer}>
          <AvaText.Caption color={colors.$neutral50}>
            Active chain
          </AvaText.Caption>
          <AvaText.Subtitle2 color={colors.$neutral50}>
            Avalanche {AvalancheChainStrings[chain]}
          </AvaText.Subtitle2>
        </Row>
      </Card>
      <Space y={16} />
      {outputs.length > 0 && (
        <>
          <AvaText.Body2
            color={colors.$neutral50}
            textStyle={{ lineHeight: 20 }}>
            Balance Change
          </AvaText.Body2>
          <Space y={8} />
          {outputs.map(output => renderOutputCard(output))}
        </>
      )}

      {chain !== PVM && !!memo && (
        <>
          <Space y={16} />
          <AvaText.Body2 color={colors.$neutral50}>Memo</AvaText.Body2>
          <Card
            style={{
              padding: 16,
              marginTop: 8,
              marginBottom: 16,
              backgroundColor: colors.$neutral800
            }}>
            <AvaText.Caption color={colors.$neutral400}>{memo}</AvaText.Caption>
          </Card>
        </>
      )}
    </>
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
    marginTop: 16,
    padding: 16
  },
  balanceCardContainer: {
    padding: 16,
    marginBottom: 8
  }
})
