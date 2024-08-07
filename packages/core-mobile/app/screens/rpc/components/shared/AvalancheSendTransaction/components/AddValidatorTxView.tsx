import React from 'react'

import { Text, useTheme } from '@avalabs/k2-mobile'
import { AddPermissionlessValidatorTx } from '@avalabs/vm-module-types'
import { Row } from 'components/Row'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { selectAvaxPrice } from 'store/balance'
import { useSelector } from 'react-redux'
import { getDateInMmmDdYyyyHhMmA } from 'utils/date/getDateInMmmDdYyyyHhMmA'
import { selectSelectedCurrency } from 'store/settings/currency'
import { isPrimarySubnet } from 'utils/network/isPrimarySubnet'
import Separator from 'components/Separator'
import Card from 'components/Card'
import AvaButton from 'components/AvaButton'
import { truncateNodeId } from 'utils/Utils'
import CopySVG from 'components/svg/CopySVG'
import { copyToClipboard } from 'utils/DeviceTools'
import { Space } from 'components/Space'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import NetworkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced'

export const AddValidatorTxView = ({
  tx
}: {
  tx: AddPermissionlessValidatorTx
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const {
    nodeID,
    delegationFee,
    start,
    end,
    stake,
    subnetID,
    signature,
    publicKey
  } = tx
  const avaxPrice = useSelector(selectAvaxPrice)
  const { tokenInCurrencyFormatter } = useApplicationContext().appHook
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const startDate = getDateInMmmDdYyyyHhMmA(parseInt(start))
  const endDate = getDateInMmmDdYyyyHhMmA(parseInt(end))
  const isPrimaryNetwork = isPrimarySubnet(subnetID)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const pNetwork = NetworkService.getAvalancheNetworkP(isDeveloperMode)
  const stakeAmount = new TokenUnit(
    stake,
    pNetwork.networkToken.decimals,
    pNetwork.networkToken.symbol
  )

  return (
    <Card>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="caption" sx={{ color: '$neutral400' }}>
          Node ID
        </Text>
        <AvaButton.TextWithIcon
          textStyle={{ textAlign: 'left' }}
          onPress={() => copyToClipboard(nodeID)}
          icon={<CopySVG />}
          iconPlacement="right"
          text={
            <Text variant="caption" sx={{ color: '$neutral50' }}>
              {truncateNodeId(nodeID)}
            </Text>
          }
        />
      </Row>
      <Space y={8} />
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="caption" sx={{ color: '$neutral400' }}>
          Subnet ID
        </Text>
        {isPrimaryNetwork ? (
          <Text variant="caption" sx={{ color: '$neutral50' }}>
            Primary Network
          </Text>
        ) : (
          <AvaButton.TextWithIcon
            textStyle={{ textAlign: 'left' }}
            onPress={() => copyToClipboard(subnetID)}
            icon={<CopySVG />}
            iconPlacement="right"
            text={
              <Text variant="caption" sx={{ color: '$neutral50' }}>
                {truncateNodeId(subnetID)}
              </Text>
            }
          />
        )}
      </Row>
      {publicKey && signature && (
        <>
          <Space y={8} />
          <Row style={{ justifyContent: 'space-between' }}>
            <Text variant="caption" sx={{ color: '$neutral400' }}>
              Public Key
            </Text>
            <AvaButton.TextWithIcon
              textStyle={{ textAlign: 'left' }}
              onPress={() => copyToClipboard(publicKey)}
              icon={<CopySVG />}
              iconPlacement="right"
              text={
                <Text variant="caption" sx={{ color: '$neutral50' }}>
                  {truncateNodeId(publicKey)}
                </Text>
              }
            />
          </Row>
          <Space y={8} />
          <Row style={{ justifyContent: 'space-between' }}>
            <Text variant="caption" sx={{ color: '$neutral400' }}>
              Proof
            </Text>
            <AvaButton.TextWithIcon
              textStyle={{ textAlign: 'left' }}
              onPress={() => copyToClipboard(signature)}
              icon={<CopySVG />}
              iconPlacement="right"
              text={
                <Text variant="caption" sx={{ color: '$neutral50' }}>
                  {truncateNodeId(signature)}
                </Text>
              }
            />
          </Row>
        </>
      )}
      <Space y={24} />
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="caption" sx={{ color: '$neutral400' }}>
          Stake Amount
        </Text>
        <Text variant="subtitle2" sx={{ color: '$neutral50' }}>
          {stakeAmount.toDisplay()} AVAX
        </Text>
      </Row>
      <Row style={{ justifyContent: 'flex-end' }}>
        <Text variant="caption" sx={{ color: '$neutral400' }}>
          {`${tokenInCurrencyFormatter(
            stakeAmount.mul(avaxPrice).toDisplay()
          )} ${selectedCurrency}`}
        </Text>
      </Row>
      <Space y={8} />
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="caption" sx={{ color: '$neutral400' }}>
          Delegation Fee
        </Text>
        <Text variant="caption" sx={{ color: '$neutral50' }}>
          {delegationFee / 10000} %
        </Text>
      </Row>
      <Separator style={{ marginVertical: 16 }} color={colors.$neutral800} />
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="caption" sx={{ color: '$neutral400' }}>
          Start Date
        </Text>
        <Text variant="subtitle2" sx={{ color: '$neutral50' }}>
          {startDate.toLocaleString()}
        </Text>
      </Row>
      <Space y={8} />
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="caption" sx={{ color: '$neutral400' }}>
          End Date
        </Text>
        <Text variant="subtitle2" sx={{ color: '$neutral50' }}>
          {endDate.toLocaleString()}
        </Text>
      </Row>
    </Card>
  )
}
