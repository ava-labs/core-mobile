import React, { FC, useEffect, useLayoutEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import DotSVG from 'components/svg/DotSVG'
import Avatar from 'components/Avatar'
import AvaListItem from 'components/AvaListItem'
import { Row } from 'components/Row'
import { Space } from 'components/Space'
import Separator from 'components/Separator'
import { useCoinGeckoId } from 'hooks/useCoinGeckoId'
import BridgeConfirmations from 'screens/bridge/components/BridgeConfirmations'
import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import { useNavigation } from '@react-navigation/native'
import Logger from 'utils/Logger'
import {
  getBlockchainDisplayName,
  getNativeTokenSymbol,
  isUnifiedBridgeTransfer
} from 'screens/bridge/utils/bridgeUtils'
import AvaButton from 'components/AvaButton'
import AppNavigation from 'navigation/AppNavigation'
import { useTokenForBridgeTransaction } from 'screens/bridge/hooks/useTokenForBridgeTransaction'
import { useBridgeTransferStatus } from 'screens/bridge/hooks/useBridgeTransferStatus'
import usePendingBridgeTransactions from 'screens/bridge/hooks/usePendingBridgeTransactions'
import { BridgeTransfer } from '@avalabs/bridge-unified'
import { humanize } from 'utils/string/humanize'
import { useBridgeAmounts } from 'screens/bridge/hooks/useBridgeAmounts'
import { useBridgeNetworkPrice } from 'screens/bridge/hooks/useBridgeNetworkPrice'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useSimplePrice } from 'hooks/useSimplePrice'
import { BridgeTransaction } from '@avalabs/core-bridge-sdk'

type Props = {
  txHash: string
  showHideButton?: boolean
}

const BridgeTransactionStatus: FC<Props> = ({ txHash, showHideButton }) => {
  const [bridgeTransaction, setBridgeTransaction] = useState<
    BridgeTransaction | BridgeTransfer
  >()
  const { activeNetwork } = useNetworks()
  const tokenInfo = useTokenForBridgeTransaction(
    bridgeTransaction,
    activeNetwork.isTestnet === true
  )

  const bridgeTransactions = usePendingBridgeTransactions(activeNetwork)

  const { theme, appHook } = useApplicationContext()
  const { selectedCurrency, currencyFormatter } = appHook
  const { navigate, getParent, dispatch, setOptions } = useNavigation()

  const symbol = isUnifiedBridgeTransfer(bridgeTransaction)
    ? bridgeTransaction?.asset.symbol
    : bridgeTransaction?.symbol

  const coingeckoId = useCoinGeckoId(symbol)

  const assetPrice = useSimplePrice(
    coingeckoId,
    selectedCurrency.toLowerCase() as VsCurrencyType
  )

  const networkPrice = useBridgeNetworkPrice(bridgeTransaction?.sourceChain)

  const { amount, sourceNetworkFee } = useBridgeAmounts(bridgeTransaction)

  const {
    isComplete,
    sourceCurrentConfirmations,
    sourceRequiredConfirmations,
    targetCurrentConfirmations,
    targetRequiredConfirmations
  } = useBridgeTransferStatus(bridgeTransaction)

  useLayoutEffect(
    function updateHeader() {
      const renderHeaderRight = (): JSX.Element | undefined =>
        showHideButton ? (
          <AvaButton.TextLarge
            onPress={() => {
              isComplete
                ? getParent()?.goBack()
                : navigate(AppNavigation.Root.Wallet, {
                    screen: AppNavigation.Wallet.Bridge,
                    params: { screen: AppNavigation.Bridge.HideWarning }
                  })
            }}>
            {isComplete ? 'Close' : 'Hide'}
          </AvaButton.TextLarge>
        ) : undefined
      setOptions({
        headerTitle: `Transaction ${isComplete ? 'Details' : 'Status'}`,
        headerRight: renderHeaderRight
      })
    },
    [
      bridgeTransaction,
      dispatch,
      getParent,
      isComplete,
      navigate,
      setOptions,
      showHideButton
    ]
  )

  useEffect(
    function cacheBridgeTransaction() {
      const transaction = bridgeTransactions.find(
        tx => tx.sourceTxHash === txHash
      )
      if (transaction)
        // Cache locally because it's removed from redux store on complete but
        // the tx should still be shown after completion.
        setBridgeTransaction(transaction)
    },
    [bridgeTransactions, txHash]
  )

  useEffect(
    function logTxStatus() {
      Logger.info(
        `updated tx: ${
          bridgeTransaction?.sourceTxHash
        } count: ${sourceCurrentConfirmations} completed: ${isComplete} completedAt: ${
          bridgeTransaction?.completedAt
        } logStamp: ${Date.now()}`
      )
    },
    [bridgeTransaction, isComplete, sourceCurrentConfirmations]
  )

  const renderTokenLogo = (): JSX.Element | undefined => {
    if (!bridgeTransaction) return undefined

    return (
      <View style={styles.logoContainer}>
        <View style={{ position: 'absolute' }}>
          <DotSVG fillColor={theme.colorBg1} size={72} />
        </View>
        <Avatar.Custom
          name={symbol ?? ''}
          logoUri={tokenInfo?.logoUri ?? ''}
          size={55}
        />
      </View>
    )
  }

  const renderNetworkFeeRightComponent = (): React.JSX.Element => {
    if (sourceNetworkFee === undefined || bridgeTransaction === undefined) {
      return <AvaText.Heading3>Pending</AvaText.Heading3>
    }

    return (
      <View style={{ alignItems: 'flex-end' }}>
        <Row>
          <AvaText.Heading3>
            {sourceNetworkFee.toNumber().toFixed(6)}{' '}
            {getNativeTokenSymbol(bridgeTransaction.sourceChain)}
          </AvaText.Heading3>
        </Row>
        <AvaText.Body3 color={theme.colorText1}>
          {currencyFormatter(networkPrice.mul(sourceNetworkFee).toNumber())}
        </AvaText.Body3>
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.infoContainer, { backgroundColor: theme.colorBg2 }]}>
        {renderTokenLogo()}
        {bridgeTransaction && (
          <View>
            <AvaListItem.Base
              title={<AvaText.Body2>Sending amount</AvaText.Body2>}
              titleAlignment={'flex-start'}
              rightComponentHorizontalAlignment={'flex-end'}
              rightComponent={
                <View style={{ alignItems: 'flex-end' }}>
                  <Row>
                    <AvaText.Heading3>
                      {amount?.toNumber().toFixed(6)}
                    </AvaText.Heading3>
                    <AvaText.Heading3 color={theme.colorText3}>
                      {' ' + symbol}
                    </AvaText.Heading3>
                  </Row>
                  {assetPrice !== undefined && (
                    <AvaText.Body3 currency color={theme.colorText1}>
                      {amount && assetPrice.mul(amount).toNumber()}
                    </AvaText.Body3>
                  )}
                </View>
              }
            />
          </View>
        )}
      </View>
      <Space y={16} />
      <View style={[styles.fromContainer, { backgroundColor: theme.colorBg2 }]}>
        <AvaListItem.Base
          title={<AvaText.Body2>From</AvaText.Body2>}
          titleAlignment="flex-start"
          rightComponent={
            <AvaText.Heading3>
              {isUnifiedBridgeTransfer(bridgeTransaction)
                ? humanize(bridgeTransaction.sourceChain.chainName)
                : getBlockchainDisplayName(bridgeTransaction?.sourceChain)}
            </AvaText.Heading3>
          }
        />
        <Separator color={theme.colorBg3} inset={16} />
        <AvaListItem.Base
          title={<AvaText.Body2>Network Fee</AvaText.Body2>}
          titleAlignment="flex-start"
          rightComponent={renderNetworkFeeRightComponent()}
        />
        <Separator color={theme.colorBg3} inset={16} />
        {bridgeTransaction && (
          <BridgeConfirmations
            started={true}
            requiredConfirmationCount={sourceRequiredConfirmations}
            startTime={bridgeTransaction.sourceStartedAt}
            endTime={bridgeTransaction.targetStartedAt}
            currentConfirmationCount={sourceCurrentConfirmations}
          />
        )}
      </View>
      <Space y={16} />
      <View style={[styles.toContainer, { backgroundColor: theme.colorBg2 }]}>
        <AvaListItem.Base
          title={<AvaText.Body2>To</AvaText.Body2>}
          titleAlignment="flex-start"
          rightComponent={
            <AvaText.Heading3>
              {isUnifiedBridgeTransfer(bridgeTransaction)
                ? humanize(bridgeTransaction.targetChain.chainName)
                : getBlockchainDisplayName(bridgeTransaction?.targetChain)}
            </AvaText.Heading3>
          }
        />
        <Separator color={theme.colorBg3} inset={16} />
        {bridgeTransaction && (
          <BridgeConfirmations
            started={!!bridgeTransaction.targetStartedAt}
            startTime={bridgeTransaction.targetStartedAt}
            endTime={bridgeTransaction.completedAt}
            requiredConfirmationCount={targetRequiredConfirmations}
            currentConfirmationCount={targetCurrentConfirmations}
            sourceChain={bridgeTransaction.sourceChain}
            targetChain={bridgeTransaction.targetChain}
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
