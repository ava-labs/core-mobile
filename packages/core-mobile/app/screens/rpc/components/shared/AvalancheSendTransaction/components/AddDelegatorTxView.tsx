import React from 'react'
import { Text, useTheme, View } from '@avalabs/k2-mobile'
import { AddPermissionlessDelegatorTx } from '@avalabs/vm-module-types'
import { Row } from 'components/Row'
import AvaButton from 'components/AvaButton'
import { copyToClipboard } from 'utils/DeviceTools'
import { truncateNodeId } from 'utils/Utils'
import CopySVG from 'components/svg/CopySVG'
import { Space } from 'components/Space'
import { isPrimarySubnet } from 'utils/network/isPrimarySubnet'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import NetworkService from 'services/network/NetworkService'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { selectAvaxPrice } from 'store/balance'
import { selectSelectedCurrency } from 'store/settings/currency'
import { getDateInMmmDdYyyyHhMmA } from 'utils/date/getDateInMmmDdYyyyHhMmA'
import Separator from 'components/Separator'

export const AddDelegatorTxView = ({
  tx
}: {
  tx: AddPermissionlessDelegatorTx
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { nodeID, start, end, stake, subnetID } = tx
  const startDate = getDateInMmmDdYyyyHhMmA(parseInt(start))
  const endDate = getDateInMmmDdYyyyHhMmA(parseInt(end))
  const avaxPrice = useSelector(selectAvaxPrice)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { tokenInCurrencyFormatter } = useApplicationContext().appHook
  const isPrimaryNetwork = isPrimarySubnet(subnetID)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const pNetwork = NetworkService.getAvalancheNetworkP(isDeveloperMode)
  const stakeAmount = new TokenUnit(
    stake,
    pNetwork.networkToken.decimals,
    pNetwork.networkToken.symbol
  )

  return (
    <View>
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
    </View>
  )
}
