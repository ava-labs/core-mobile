import React, { FC, useEffect } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import {
  Blockchain,
  TrackerViewProps,
  TransactionDetails,
  useBridgeConfig,
  useBridgeSDK,
  useTxTracker
} from '@avalabs/bridge-sdk'
import { BridgeTransaction, useBridgeContext } from 'contexts/BridgeContext'
import {
  TransactionNormal,
  useNetworkContext,
  useWalletStateContext
} from '@avalabs/wallet-react-components'
import { getAvalancheProvider } from 'screens/bridge/utils/getAvalancheProvider'
import { getEthereumProvider } from 'screens/bridge/utils/getEthereumProvider'
import { ShowSnackBar } from 'components/Snackbar'
import AvaText from 'components/AvaText'
import AvaListItem from 'components/AvaListItem'
import BridgeSVG from 'components/svg/BridgeSVG'
import { Opacity10 } from 'resources/Constants'
import { StyleSheet, View } from 'react-native'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
import Spinner from 'components/Spinner'
import LinkSVG from 'components/svg/LinkSVG'
import { Space } from 'components/Space'
import useInAppBrowser from 'hooks/useInAppBrowser'

type TransactionBridgeItem = BridgeTransaction &
  TransactionNormal &
  TransactionDetails

interface BridgeTransactionItemProps {
  item: TransactionBridgeItem
  onPress: () => void
}

const BridgeTransactionItem: FC<BridgeTransactionItemProps> = ({ item }) => {
  const theme = useApplicationContext().theme
  const fromAvalancheToEthereum =
    item.sourceNetwork === Blockchain.AVALANCHE ||
    item.to === '0x0000000000000000000000000000000000000000'
  const { network } = useNetworkContext()
  const { config } = useBridgeConfig()
  const { removeBridgeTransaction } = useBridgeContext()
  const { addresses } = useWalletStateContext()
  const { transactionDetails, bridgeAssets, setTransactionDetails } =
    useBridgeSDK()
  const navigation = useNavigation()
  const { openUrl } = useInAppBrowser()
  let fallbackRunning = false

  const pending = 'complete' in item && !item.complete

  const txProps: TrackerViewProps | undefined =
    pending && item?.sourceTxHash
      ? // @TODO: breaking rules of hook.. useTxTracker should prob not be a hook
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useTxTracker(
          item.sourceNetwork,
          item.sourceTxHash,
          item.timeStamp,
          getAvalancheProvider(network),
          getEthereumProvider(network),
          setTransactionDetails,
          config,
          addresses?.addrC,
          transactionDetails,
          bridgeAssets
        )
      : undefined

  // Currently there's a bug where txProps.complete never returns true.
  // this function will remove the pending transaction if `confirmationCount > requiredConfirmationCount`
  // but part of the in the SDK is that useTxTracker will keep running in the background and making requests.
  // The bridge team is aware of that and is working on a fix.
  function fallbackCountdown() {
    let seconds = 60
    function tick() {
      seconds--
      if (seconds > 0) {
        setTimeout(tick, 1000)
      } else {
        removeBridgeTransaction({ ...txProps }).then()
      }
    }
    tick()
  }

  useEffect(() => {
    if (txProps) {
      if (txProps?.complete) {
        ShowSnackBar(`You have received ${txProps.amount} ${txProps.symbol}`)
        removeBridgeTransaction({ ...txProps }).then()
      } else if (
        txProps.confirmationCount > txProps.requiredConfirmationCount
      ) {
        if (!fallbackRunning) {
          fallbackRunning = true
          fallbackCountdown()
        }
      }
    }
  }, [txProps?.complete, txProps?.confirmationCount])

  function openTransactionStatus() {
    navigation.navigate(AppNavigation.Bridge.BridgeTransactionStatus, {
      blockchain: item.sourceNetwork,
      txHash: item.sourceTxHash,
      txTimestamp: item.createdAt
        ? Date.parse(item.createdAt.toString())
        : item.timestamp || item.timeStamp || Date.now().toString()
    })
  }

  return (
    <AvaListItem.Base
      title={pending ? 'Bridging...' : 'Bridge'}
      leftComponent={
        <View
          style={[
            styles.indicator,
            {
              backgroundColor: theme.colorStroke2 + Opacity10
            }
          ]}>
          <BridgeSVG size={20} color={theme.colorPrimary1} />
          {pending && txProps && (
            <View style={{ position: 'absolute' }}>
              <Spinner size={50} />
            </View>
          )}
        </View>
      }
      subtitle={
        fromAvalancheToEthereum
          ? 'Avalanche → Ethereum'
          : 'Ethereum → Avalanche'
      }
      rightComponent={
        <View style={{ justifyContent: 'center', alignItems: 'flex-end' }}>
          <AvaText.ActivityTotal ellipsizeMode={'tail'}>
            {pending ? item.amount.toString() : item.amountDisplayValue}{' '}
            {pending ? item.symbol : item.tokenSymbol}
          </AvaText.ActivityTotal>
          {item.explorerLink && (
            <>
              <Space y={8} />
              <LinkSVG color={theme.white} />
            </>
          )}
        </View>
      }
      embedInCard
      onPress={() => {
        if (pending) {
          openTransactionStatus()
        } else if (item.explorerLink) {
          openUrl(item.explorerLink).then()
        }
      }}
    />
  )
}

const styles = StyleSheet.create({
  indicator: {
    paddingHorizontal: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center'
  }
})

export default BridgeTransactionItem
