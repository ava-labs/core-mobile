import { BridgeTransfer } from '@avalabs/bridge-unified'
import { BridgeTransaction } from '@avalabs/core-bridge-sdk'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useState, useEffect, useMemo } from 'react'
import { useCoinGeckoId } from 'hooks/useCoinGeckoId'
import { useSimplePrice } from 'hooks/useSimplePrice'
import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import Logger from 'utils/Logger'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import {
  alpha,
  Button,
  GroupList,
  GroupListItem,
  Icons,
  ProgressBar,
  SafeAreaView,
  ScrollView,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import ScreenHeader from 'common/components/ScreenHeader'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { NetworkLogo } from 'common/components/NetworkLogo'
import { useNetworks } from 'hooks/networks/useNetworks'
import { Network } from '@avalabs/core-chains-sdk'
import Animated, {
  FadeIn,
  FadeOut,
  SharedValue,
  useSharedValue
} from 'react-native-reanimated'
import usePendingBridgeTransactions from '../hooks/usePendingBridgeTransactions'
import {
  getNativeTokenSymbol,
  getSourceChainId,
  getTargetChainId,
  isUnifiedBridgeTransfer
} from '../utils/bridgeUtils'
import { useBridgeNetworkPrice } from '../hooks/useBridgeNetworkPrice'
import { useBridgeAmounts } from '../hooks/useBridgeAmounts'
import { useBridgeTransferStatus } from '../hooks/useBridgeTransferStatus'

export const BridgeStatusScreen = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { txHash, chainId } = useLocalSearchParams<{
    txHash: string
    chainId: string
  }>()

  const [bridgeTransaction, setBridgeTransaction] = useState<
    BridgeTransaction | BridgeTransfer
  >()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const bridgeTransactions = usePendingBridgeTransactions(Number(chainId))
  const { formatCurrency } = useFormatCurrency()
  const { getNetwork } = useNetworks()

  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { back } = useRouter()

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

  const sourceConfirmationProgress = useSharedValue(0)
  const targetConfirmationProgress = useSharedValue(0)

  useEffect(() => {
    sourceConfirmationProgress.value =
      (sourceCurrentConfirmations + 1) / (sourceRequiredConfirmations + 1)
  }, [
    sourceCurrentConfirmations,
    sourceRequiredConfirmations,
    sourceConfirmationProgress
  ])

  useEffect(() => {
    targetConfirmationProgress.value =
      (targetCurrentConfirmations + 1) / (targetRequiredConfirmations + 1)
  }, [
    targetCurrentConfirmations,
    targetRequiredConfirmations,
    targetConfirmationProgress
  ])

  const sourceNetwork = useMemo(
    () => getNetwork(getSourceChainId(bridgeTransaction, isDeveloperMode)),
    [getNetwork, bridgeTransaction, isDeveloperMode]
  )

  const targetNetwork = useMemo(
    () => getNetwork(getTargetChainId(bridgeTransaction, isDeveloperMode)),
    [getNetwork, bridgeTransaction, isDeveloperMode]
  )

  const sourceData = useMemo(() => {
    const data: GroupListItem[] = [
      {
        title: 'From',
        value: sourceNetwork && <NetworkComponent network={sourceNetwork} />
      }
    ]
    if (sourceNetworkFee !== undefined && bridgeTransaction !== undefined) {
      data.push({
        title: 'Network fee',
        value: (
          <View style={{ alignItems: 'flex-end' }}>
            <Text variant="body1" sx={{ color: '$textSecondary' }}>
              {sourceNetworkFee.toNumber().toFixed(6)}{' '}
              {getNativeTokenSymbol(bridgeTransaction.sourceChain)}
            </Text>
            <Text variant="caption" sx={{ color: '$textSecondary' }}>
              {formatCurrency({
                amount: networkPrice.mul(sourceNetworkFee).toNumber()
              })}
            </Text>
          </View>
        )
      })
    }
    data.push({
      title: 'Confirmations',
      value:
        sourceCurrentConfirmations === sourceRequiredConfirmations ? (
          <Done />
        ) : (
          <Text variant="body1" sx={{ color: '$textSecondary' }}>
            {`${sourceCurrentConfirmations} out of ${sourceRequiredConfirmations}`}
          </Text>
        ),
      bottomAccessory:
        sourceCurrentConfirmations < sourceRequiredConfirmations ? (
          <ConfirmationProgress progress={sourceConfirmationProgress} />
        ) : undefined
    })

    return data
  }, [
    bridgeTransaction,
    sourceNetworkFee,
    networkPrice,
    formatCurrency,
    sourceCurrentConfirmations,
    sourceRequiredConfirmations,
    sourceConfirmationProgress,
    sourceNetwork
  ])

  const targetData = useMemo(() => {
    const data: GroupListItem[] = [
      {
        title: 'To',
        value: targetNetwork && <NetworkComponent network={targetNetwork} />
      }
    ]
    data.push({
      title: 'Confirmations',
      value:
        targetCurrentConfirmations === targetRequiredConfirmations ? (
          <Done />
        ) : (
          <Text variant="body1" sx={{ color: '$textSecondary' }}>
            {`${targetCurrentConfirmations} out of ${targetRequiredConfirmations}`}
          </Text>
        ),
      bottomAccessory:
        sourceCurrentConfirmations === sourceRequiredConfirmations &&
        targetCurrentConfirmations < targetRequiredConfirmations ? (
          <ConfirmationProgress progress={targetConfirmationProgress} />
        ) : undefined
    })

    return data
  }, [
    targetCurrentConfirmations,
    targetRequiredConfirmations,
    sourceCurrentConfirmations,
    sourceRequiredConfirmations,
    targetNetwork,
    targetConfirmationProgress
  ])

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

  return (
    <SafeAreaView sx={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerSx={{ padding: 16, paddingTop: 0 }}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="always">
        <ScreenHeader title={`Bridging\nin progress...`} />
        <View sx={{ gap: 12, marginTop: 16 }}>
          <View
            sx={{
              backgroundColor: '$surfaceSecondary',
              paddingVertical: 30,
              paddingHorizontal: 16,
              borderRadius: 12,
              alignItems: 'center'
            }}>
            <View
              sx={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 5
              }}>
              <Text
                variant="heading1"
                sx={{
                  color: '$textPrimary'
                }}>
                {amount?.toNumber()}
              </Text>
              <Text
                sx={{
                  fontFamily: 'Aeonik-Medium',
                  fontSize: 24,
                  lineHeight: 24,
                  marginTop: 4
                }}>
                {symbol}
              </Text>
            </View>
            {assetPrice !== undefined && (
              <Text
                variant="subtitle2"
                sx={{ marginTop: 0, color: alpha(colors.$textPrimary, 0.9) }}>
                {amount &&
                  formatCurrency({ amount: assetPrice.mul(amount).toNumber() })}
              </Text>
            )}
          </View>
          <GroupList
            itemHeight={48}
            data={sourceData}
            separatorMarginRight={16}
          />
          <GroupList
            itemHeight={48}
            data={targetData}
            separatorMarginRight={16}
          />
        </View>
      </ScrollView>
      <View
        sx={{
          padding: 16,
          gap: 20
        }}>
        <Button type="primary" size="large" onPress={back}>
          {isComplete ? 'Close' : 'Hide'}
        </Button>
      </View>
    </SafeAreaView>
  )
}

const Done = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  return (
    <Animated.View
      style={{ gap: 8, flexDirection: 'row', alignItems: 'center' }}
      entering={FadeIn}
      exiting={FadeOut}>
      <Icons.Action.CheckCircle color={colors.$textSuccess} />
      <Text variant="body1" sx={{ color: '$textSuccess', fontWeight: 500 }}>
        Done
      </Text>
    </Animated.View>
  )
}

const NetworkComponent = ({ network }: { network: Network }): JSX.Element => {
  return (
    <View sx={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
      <NetworkLogo logoUri={network.logoUri} size={24} />
      <Text variant="body1" sx={{ color: '$textSecondary' }}>
        {network?.chainName}
      </Text>
    </View>
  )
}

const ConfirmationProgress = ({
  progress
}: {
  progress: SharedValue<number>
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  return (
    <Animated.View style={{ padding: 16, paddingBottom: 18, paddingTop: 10 }}>
      <View
        sx={{
          height: 5,
          backgroundColor: alpha(colors.$textSecondary, 0.15),
          borderRadius: 5
        }}>
        <ProgressBar
          color={colors.$textSuccess}
          progress={progress}
          progressBarStyle={{ borderRadius: 5 }}
        />
      </View>
    </Animated.View>
  )
}
