import React, { FC, memo } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'
import { usePortfolio } from 'screens/portfolio/usePortfolio'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import AvaxQACode from 'components/AvaxQRCode'
import TokenAddress from 'components/TokenAddress'
import {
  selectActiveNetwork,
  BITCOIN_NETWORK,
  MAINNET_NETWORK,
  FUJI_NETWORK
} from 'store/network'
import { useWalletContext } from '@avalabs/wallet-react-components'
import { useIsMainnet } from 'hooks/isMainnet'

type Props = {
  embedded: boolean
}

const ReceiveToken2: FC<Props> = memo(props => {
  const theme = useApplicationContext().theme
  const embedded = !!props?.embedded
  const activeNetwork = useSelector(selectActiveNetwork)
  const { chainId, nativeToken } = activeNetwork
  const { addressC } = usePortfolio()
  const wallet = useWalletContext().wallet
  const isMainnet = useIsMainnet()
  const btcAddress =
    wallet?.getAddressBTC(isMainnet ? 'bitcoin' : 'testnet') ?? ''

  const receiveAddress = () => {
    switch (chainId) {
      case BITCOIN_NETWORK.chainId:
        return btcAddress
      case MAINNET_NETWORK.chainId:
      case FUJI_NETWORK.chainId:
      default:
        return addressC
    }
  }

  // TODO: replace this with actual chainName
  const networkLabel = () => {
    switch (chainId) {
      case BITCOIN_NETWORK.chainId:
        return 'Bitcoin'
      case MAINNET_NETWORK.chainId:
      case FUJI_NETWORK.chainId:
      default:
        return 'C-Chain'
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
            sizePercentage={0.7}
            address={receiveAddress()}
            token={nativeToken.symbol}
          />
        </View>
        <Space y={47} />
        <View style={styles.networkContainer}>
          <AvaText.Heading3>{networkLabel()} Address</AvaText.Heading3>
        </View>
        <View
          style={[
            styles.copyAddressContainer,
            { backgroundColor: theme.colorBg2 }
          ]}>
          <TokenAddress
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

export default ReceiveToken2
