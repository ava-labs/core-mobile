import React, { FC, useLayoutEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { BridgeStackParamList } from 'navigation/wallet/BridgeScreenStack'
import AvaText from 'components/AvaText'
import {
  Blockchain,
  BridgeTransaction,
  getNativeSymbol,
  useBridgeSDK,
  usePrice,
  usePriceForChain,
  useTokenInfoContext
} from '@avalabs/bridge-sdk'
import DotSVG from 'components/svg/DotSVG'
import Avatar from 'components/Avatar'
import AvaListItem from 'components/AvaListItem'
import { Row } from 'components/Row'
import { Space } from 'components/Space'
import Separator from 'components/Separator'
import BridgeConfirmations from 'screens/bridge/components/BridgeConfirmations'
import { useBridgeContext } from 'contexts/BridgeContext'
import { StackNavigationProp } from '@react-navigation/stack'
import AppNavigation from 'navigation/AppNavigation'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import AvaButton from 'components/AvaButton'

type Props = {
  blockchain: string
  txHash: string
  txTimestamp: string
  setNavOptions: (options: StackNavigationOptions) => void
  HeaderRight?: ReactNode
}

const BridgeTransactionStatus: FC<Props> = ({
  blockchain,
  txHash,
  txTimestamp,
  setNavOptions,
  HeaderRight = null
}) => {
  const { theme } = useApplicationContext()
  // @ts-ignore addresses exist in walletContext
  const { addresses } = useWalletStateContext()
  const tokenInfoData = useTokenInfoContext();
  const { config } = useBridgeConfig()
  // @ts-ignore network exist in networkContext
  const { network } = useNetworkContext()
  const ethereumProvider = getEthereumProvider(network)
  const avalancheProvider = getAvalancheProvider(network)
  const { getTokenSymbolOnNetwork } = useGetTokenSymbolOnNetwork()
  const { currentAsset, transactionDetails } = useBridgeSDK()
  const { bridgeTransactions, removeBridgeTransaction } = useBridgeContext()
  const bridgeTransaction = bridgeTransactions[txHash] as
    | BridgeTransaction
    | undefined
  console.log(
    `updated tx: ${bridgeTransaction?.sourceTxHash} count: ${
      bridgeTransaction?.confirmationCount
    } completed: ${bridgeTransaction?.complete} completedAt: ${
      bridgeTransaction?.completedAt
    } logStamp: ${Date.now()}`
  )
  const { theme, appHook } = useApplicationContext()
  const { selectedCurrency, currencyFormatter } = appHook
  const navigation = useNavigation<StackNavigationProp<BridgeStackParamList>>()
  const tokenInfoData = useTokenInfoContext()
  const { currentAsset, transactionDetails } = useBridgeSDK()

  const assetPrice = usePrice(
    bridgeTransaction?.symbol || currentAsset,
    selectedCurrency.toLowerCase() as VsCurrencyType
  )
  const networkPrice = usePriceForChain(bridgeTransaction?.sourceChain)

  const formattedNetworkPrice =
    networkPrice && bridgeTransaction?.sourceNetworkFee
      ? currencyFormatter(
          networkPrice.mul(bridgeTransaction.sourceNetworkFee).toNumber()
        )
      : '-'

  useLayoutEffect(() => {
    if (bridgeTransaction) {
      navigation.setOptions({
        title: `Transaction ${
          bridgeTransaction.complete ? 'Details' : 'Status'
        }`,
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

      if (bridgeTransaction.complete) {
        removeBridgeTransaction(bridgeTransaction.sourceTxHash)
      }
    }
  }, [bridgeTransaction?.complete])

  const tokenLogo = (
    <View style={styles.logoContainer}>
      <View style={{ position: 'absolute' }}>
        <DotSVG fillColor={theme.colorBg1} size={72} />
      </View>
      <Avatar.Custom
        name={transactionDetails?.tokenSymbol ?? ''}
        logoUri={
          transactionDetails?.tokenSymbol &&
          tokenInfoData?.[transactionDetails?.tokenSymbol]?.logo
        }
        size={55}
      />
    </View>
  )

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.infoContainer, { backgroundColor: theme.colorBg2 }]}>
        {tokenLogo}
        {bridgeTransaction && (
          <View>
            <AvaListItem.Base
              title={'Sending amount'}
              titleAlignment={'flex-start'}
              rightComponentHorizontalAlignment={'flex-end'}
              rightComponent={
                <View style={{ alignItems: 'flex-end' }}>
                  <Row>
                    <AvaText.Heading3>
                      {bridgeTransaction?.amount?.toNumber()}
                    </AvaText.Heading3>
                    <AvaText.Heading3 color={theme.colorText3}>
                      {bridgeTransaction?.symbol}
                    </AvaText.Heading3>
                  </Row>
                  <AvaText.Body3 currency color={theme.colorText1}>
                    {assetPrice.mul(bridgeTransaction?.amount ?? 0).toNumber()}
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
              {bridgeTransaction?.sourceChain?.toUpperCase()}
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
                  {bridgeTransaction?.sourceNetworkFee?.toNumber().toFixed(6)}{' '}
                  {getNativeSymbol(
                    bridgeTransaction?.sourceChain ?? Blockchain.UNKNOWN
                  )}
                </AvaText.Heading3>
              </Row>
              <AvaText.Body3 currency color={theme.colorText1}>
                ~{formattedNetworkPrice} {selectedCurrency}
              </AvaText.Body3>
            </View>
          }
        />
        <Separator color={theme.colorBg3} inset={16} />
        {bridgeTransaction && (
          <BridgeConfirmations
            started={true}
            requiredConfirmationCount={
              bridgeTransaction.requiredConfirmationCount
            }
            complete={bridgeTransaction.complete}
            startTime={bridgeTransaction.sourceStartedAt}
            endTime={bridgeTransaction.targetStartedAt}
            confirmationCount={bridgeTransaction.confirmationCount}
          />
        )}
      </View>
      <Space y={16} />
      <View style={[styles.toContainer, { backgroundColor: theme.colorBg2 }]}>
        <AvaListItem.Base
          title={'To'}
          rightComponent={
            <AvaText.Heading3>
              {bridgeTransaction?.targetChain?.toUpperCase()}
            </AvaText.Heading3>
          }
        />
        <Separator color={theme.colorBg3} inset={16} />
        {bridgeTransaction && (
          <BridgeConfirmations
            started={!!bridgeTransaction.targetStartedAt}
            startTime={bridgeTransaction.targetStartedAt}
            endTime={bridgeTransaction.completedAt}
            requiredConfirmationCount={
              1 // On avalanche, we just need 1 confirmation
            }
            complete={bridgeTransaction.complete}
            confirmationCount={bridgeTransaction.confirmationCount}
          />
        )}
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
