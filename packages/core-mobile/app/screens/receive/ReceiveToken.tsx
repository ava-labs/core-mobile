import React, { FC, memo, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import AvaxQACode from 'components/AvaxQRCode'
import TokenAddress from 'components/TokenAddress'
import { ChainId } from '@avalabs/chains-sdk'
import { selectActiveAccount } from 'store/account'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useNetworks } from 'hooks/networks/useNetworks'

type Props = {
  embedded: boolean
}

const ReceiveToken: FC<Props> = memo(props => {
  const theme = useApplicationContext().theme
  const { activeNetwork } = useNetworks()
  const embedded = !!props?.embedded
  const activeAccount = useSelector(selectActiveAccount)
  const { chainId, networkToken, chainName } = activeNetwork
  const addressC = activeAccount?.address
  const btcAddress = activeAccount?.addressBtc

  useEffect(() => {
    AnalyticsService.capture('ReceivePageVisited')
  }, [])

  const receiveAddress = (): string => {
    switch (chainId) {
      case ChainId.BITCOIN:
      case ChainId.BITCOIN_TESTNET:
        return btcAddress ?? ''
      case ChainId.AVALANCHE_MAINNET_ID:
      case ChainId.AVALANCHE_TESTNET_ID:
      default:
        return addressC ?? ''
    }
  }

  return (
    <View
      style={{
        flex: 1
      }}>
      <Space y={embedded ? 34 : 8} />
      {embedded || (
        <>
          <AvaText.LargeTitleBold textStyle={{ marginHorizontal: 16 }}>
            Receive
          </AvaText.LargeTitleBold>
          <Space y={12} />
        </>
      )}

      <View style={styles.container}>
        <Space y={52} />
        <View style={{ alignSelf: 'center' }}>
          <AvaxQACode
            testID="receive_token_qr_code"
            sizePercentage={0.7}
            address={receiveAddress()}
            token={networkToken.symbol}
            label={chainName}
          />
        </View>
        <Space y={47} />
        <View style={styles.networkContainer}>
          <AvaText.Heading3 testID="network_chain_name">
            {activeNetwork.chainName} Address
          </AvaText.Heading3>
        </View>
        <View
          style={[
            styles.copyAddressContainer,
            { backgroundColor: theme.colorBg2 }
          ]}>
          <TokenAddress
            testID="receive_token_address"
            address={receiveAddress()}
            showFullAddress
            textType={'ButtonMedium'}
            copyIconEnd
          />
        </View>
        <Space y={16} />
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    alignItems: 'center'
  },
  networkContainer: {
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 8
  },
  copyAddressContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 24
  }
})

export default ReceiveToken
