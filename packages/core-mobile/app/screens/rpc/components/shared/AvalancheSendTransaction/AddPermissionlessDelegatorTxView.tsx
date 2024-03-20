import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Card from 'components/Card'
import { bigIntToString } from '@avalabs/utils-sdk'
import { truncateNodeId } from 'utils/Utils'
import Separator from 'components/Separator'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { selectAvaxPrice } from 'store/balance'
import { isPrimarySubnet } from 'utils/network/isPrimarySubnet'
import { Text, useTheme } from '@avalabs/k2-mobile'
import CopySVG from 'components/svg/CopySVG'
import { copyToClipboard } from 'utils/DeviceTools'
import AvaButton from 'components/AvaButton'
import { getDateInMmmDdYyyyHhMmA } from 'utils/date/getDateInMmmDdYyyyHhMmA'
import { Avalanche } from '@avalabs/wallets-sdk'
import { TxFee } from './components/TxFee'

type AddPermissionlessDelegatorTx = Pick<
  Avalanche.AddPermissionlessDelegatorTx,
  'nodeID' | 'start' | 'end' | 'stake' | 'subnetID' | 'txFee'
>

export const AddPermissionlessDelegatorTxView = ({
  tx
}: {
  tx: AddPermissionlessDelegatorTx
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const avaxPrice = useSelector(selectAvaxPrice)
  const { tokenInCurrencyFormatter } = useApplicationContext().appHook
  const { nodeID, start, end, stake, txFee, subnetID } = tx
  const startDate = getDateInMmmDdYyyyHhMmA(parseInt(start))
  const endDate = getDateInMmmDdYyyyHhMmA(parseInt(end))
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const isPrimaryNetwork = isPrimarySubnet(subnetID)

  return (
    <View>
      <Text variant="heading4">Add Delegator</Text>
      <Space y={28} />
      <Text variant="body2" sx={{ color: '$neutral50' }}>
        Staking Details
      </Text>
      <Space y={8} />
      <Card style={styles.cardContainer}>
        <Row style={styles.rowContainer}>
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
        <Row style={styles.rowContainer}>
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
        <Row style={styles.rowCenterContainer}>
          <Text variant="caption" sx={{ color: '$neutral400' }}>
            Stake Amount
          </Text>
          <Text variant="subtitle2" sx={{ color: '$neutral50' }}>
            {Number(bigIntToString(stake, 9))} AVAX
          </Text>
        </Row>
        <Row style={styles.currencyContainer}>
          <Text variant="caption" sx={{ color: '$neutral400' }}>
            {`${tokenInCurrencyFormatter(
              Number(bigIntToString(stake, 9)) * avaxPrice
            )} ${selectedCurrency}`}
          </Text>
        </Row>
        <Space y={8} />
        <Separator style={styles.separator} color={colors.$neutral800} />
        <Row style={styles.rowCenterContainer}>
          <Text variant="caption" sx={{ color: '$neutral400' }}>
            Start Date
          </Text>
          <Text variant="subtitle2" sx={{ color: '$neutral50' }}>
            {startDate.toLocaleString()}
          </Text>
        </Row>
        <Space y={8} />
        <Row style={styles.rowCenterContainer}>
          <Text variant="caption" sx={{ color: '$neutral400' }}>
            End Date
          </Text>
          <Text variant="subtitle2" sx={{ color: '$neutral50' }}>
            {endDate.toLocaleString()}
          </Text>
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
  rowCenterContainer: {
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  separator: {
    marginVertical: 16
  },
  currencyContainer: {
    justifyContent: 'flex-end'
  },
  cardContainer: {
    padding: 16
  }
})
