import React, { FC, useEffect, useLayoutEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { BridgeStackParamList } from 'navigation/wallet/BridgeScreenStack'
import AvaText from 'components/AvaText'
import {
  Blockchain,
  useBridgeConfig,
  useBridgeSDK,
  usePrice,
  useTxTracker
} from '@avalabs/bridge-sdk'
import {
  useNetworkContext,
  useWalletStateContext
} from '@avalabs/wallet-react-components'
import { getEthereumProvider } from 'screens/bridge/utils/getEthereumProvider'
import { getAvalancheProvider } from 'screens/bridge/utils/getAvalancheProvider'
import DotSVG from 'components/svg/DotSVG'
import Avatar from 'components/Avatar'
import AvaListItem from 'components/AvaListItem'
import { Row } from 'components/Row'
import { Space } from 'components/Space'
import Separator from 'components/Separator'
import BridgeConfirmations from 'screens/bridge/components/BridgeConfirmations'
import { useGetTokenSymbolOnNetwork } from 'screens/bridge/hooks/useGetTokenSymbolOnNetwork'
import useBridge from 'screens/bridge/hooks/useBridge'
import { useBridgeContext } from 'contexts/BridgeContext'
import { StackNavigationProp } from '@react-navigation/stack'
import AvaButton from 'components/AvaButton'
import AppNavigation from 'navigation/AppNavigation'

interface Props {
  fromStack?: boolean
}

const BridgeTransactionStatus: FC<Props> = ({ fromStack }) => {
  const { theme } = useApplicationContext()
  const navigation = useNavigation<StackNavigationProp<BridgeStackParamList>>()
  const { blockchain, txHash, txTimestamp } =
    useRoute<
      RouteProp<
        BridgeStackParamList,
        typeof AppNavigation.Bridge.BridgeTransactionStatus
      >
    >()?.params || {}
  // @ts-ignore addresses exist in walletContext
  const { addresses } = useWalletStateContext()
  const { config } = useBridgeConfig()
  // @ts-ignore network exist in networkContext
  const { network } = useNetworkContext()
  const ethereumProvider = getEthereumProvider(network)
  const avalancheProvider = getAvalancheProvider(network)
  const { getTokenSymbolOnNetwork } = useGetTokenSymbolOnNetwork()
  const { tokenInfoContext, assetInfo } = useBridge()
  const { createBridgeTransaction, removeBridgeTransaction } =
    useBridgeContext()

  const {
    currentAsset,
    transactionDetails,
    bridgeAssets,
    setTransactionDetails,
    currentBlockchain
  } = useBridgeSDK()

  const txProps = useTxTracker(
    blockchain as Blockchain,
    txHash ?? '',
    txTimestamp ?? '',
    avalancheProvider,
    ethereumProvider,
    setTransactionDetails,
    config,
    addresses?.addrC,
    transactionDetails,
    bridgeAssets
  )
  useLayoutEffect(() => {
    if (txProps) {
      navigation.setOptions({
        title: `Transaction ${txProps.complete ? 'Details' : 'Status'}`,
        headerRight: () =>
          fromStack ? (
            <AvaButton.TextLarge
              onPress={() => {
                navigation.navigate(AppNavigation.Bridge.HideWarning)
              }}>
              Hide
            </AvaButton.TextLarge>
          ) : null
      })

      if (txProps.complete) {
        removeBridgeTransaction({ ...txProps })
      }
    }
  }, [txProps?.complete])

  useEffect(() => {
    createBridgeTransaction({ ...txProps }).then()
  }, [])

  const tokenSymbolOnNetwork = getTokenSymbolOnNetwork(
    currentAsset ?? '',
    currentBlockchain
  )

  const assetPrice = usePrice(txProps?.symbol || currentAsset)

  const tokenLogo = (
    <View style={styles.logoContainer}>
      <View style={{ position: 'absolute' }}>
        <DotSVG fillColor={theme.colorBg1} size={72} />
      </View>
      <Avatar.Custom
        name={assetInfo.symbol}
        symbol={assetInfo.symbol}
        logoUri={tokenInfoContext?.[tokenSymbolOnNetwork]?.logo}
        size={55}
      />
    </View>
  )

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.infoContainer, { backgroundColor: theme.colorBg2 }]}>
        {tokenLogo}
        {txProps && (
          <View>
            <AvaListItem.Base
              title={'Sending amount'}
              titleAlignment={'flex-start'}
              rightComponentHorizontalAlignment={'flex-end'}
              rightComponent={
                <View style={{ alignItems: 'flex-end' }}>
                  <Row>
                    <AvaText.Heading3>
                      {txProps?.amount?.toNumber()}
                    </AvaText.Heading3>
                    <AvaText.Heading3 color={theme.colorText3}>
                      {txProps?.symbol}
                    </AvaText.Heading3>
                  </Row>
                  <AvaText.Body3 currency color={theme.colorText1}>
                    {assetPrice.mul(txProps?.amount ?? 0).toNumber()}
                  </AvaText.Body3>
                </View>
              }
            />
          </View>
        )}
      </View>
      <Space y={16} />
      <View style={[styles.fromContainer, { backgroundColor: theme.colorBg2 }]}>
        <AvaListItem.Base
          title={'From'}
          rightComponent={
            <AvaText.Heading3>
              {blockchain === Blockchain.AVALANCHE ? 'Avalanche' : 'Ethereum'}
            </AvaText.Heading3>
          }
        />
        <Separator color={theme.colorBg3} inset={16} />
        <AvaListItem.Base
          title={'Network Fee'}
          rightComponent={
            <View style={{ alignItems: 'flex-end' }}>
              <Row>
                <AvaText.Heading3>
                  {txProps.gasCost?.toNumber().toFixed(6)} {txProps.symbol}
                </AvaText.Heading3>
              </Row>
              <AvaText.Body3 currency color={theme.colorText1}>
                ~{txProps.gasValue?.toNumber().toFixed(2)} USD
              </AvaText.Body3>
            </View>
          }
        />
        <Separator color={theme.colorBg3} inset={16} />
        <BridgeConfirmations
          started={true}
          requiredConfirmationCount={txProps.requiredConfirmationCount}
          complete={txProps.complete}
          tickerSeconds={txProps.sourceSeconds}
          confirmationCount={txProps.confirmationCount}
        />
      </View>
      <Space y={16} />
      <View style={[styles.toContainer, { backgroundColor: theme.colorBg2 }]}>
        <AvaListItem.Base
          title={'To'}
          rightComponent={
            <AvaText.Heading3>
              {blockchain === Blockchain.AVALANCHE ? 'Ethereum' : 'Avalanche'}
            </AvaText.Heading3>
          }
        />
        <Separator color={theme.colorBg3} inset={16} />
        <BridgeConfirmations
          started={txProps.targetSeconds > 0}
          requiredConfirmationCount={
            1 // On avalanche, we just need 1 confirmation
          }
          complete={txProps.complete}
          tickerSeconds={txProps.targetSeconds}
          confirmationCount={txProps.complete ? 1 : 0}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 100,
    zIndex: 1000
  },
  infoContainer: {
    marginTop: 30,
    paddingTop: 30,
    marginHorizontal: 16,
    borderRadius: 10
  },
  fromContainer: {
    minHeight: 200,
    marginHorizontal: 16,
    paddingBottom: 16,
    borderRadius: 10
  },
  toContainer: {
    marginHorizontal: 16,
    borderRadius: 10,
    paddingBottom: 16
  }
})

export default BridgeTransactionStatus
