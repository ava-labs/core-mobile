import { BridgeTransfer } from '@avalabs/bridge-unified'
import { BridgeTransaction } from '@avalabs/core-bridge-sdk'
import { Network } from '@avalabs/core-chains-sdk'
import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import {
  ActivityIndicator,
  alpha,
  Button,
  GroupList,
  GroupListItem,
  Icons,
  ProgressBar,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { NetworkLogo } from 'common/components/NetworkLogo'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import {
  getNativeTokenSymbol,
  getSourceChainId,
  getTargetChainId,
  isUnifiedBridgeTransfer
} from 'common/utils/bridgeUtils'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useCoinGeckoId } from 'hooks/useCoinGeckoId'
import { useSimplePrices } from 'hooks/useSimplePrices'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue
} from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectSelectedCurrency } from 'store/settings/currency'
import Logger from 'utils/Logger'
import { useBridgeAmounts } from '../hooks/useBridgeAmounts'
import { useBridgeNetworkPrice } from '../hooks/useBridgeNetworkPrice'
import { useBridgeTransferStatus } from '../hooks/useBridgeTransferStatus'
import usePendingBridgeTransactions from '../hooks/usePendingBridgeTransactions'

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

  const { data: assetPrices } = useSimplePrices(
    coingeckoId ? [coingeckoId] : [],
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
    data.push({
      title: 'Network fee',
      value:
        sourceNetworkFee !== undefined && bridgeTransaction !== undefined ? (
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
        ) : (
          <ActivityIndicator />
        )
    })
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
      bottomAccessory: (
        <ConfirmationProgress
          currentConfirmations={sourceCurrentConfirmations}
          requiredConfirmations={sourceRequiredConfirmations}
        />
      )
    })

    return data
  }, [
    bridgeTransaction,
    sourceNetworkFee,
    networkPrice,
    formatCurrency,
    sourceCurrentConfirmations,
    sourceRequiredConfirmations,
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
        sourceCurrentConfirmations === sourceRequiredConfirmations ? (
          <ConfirmationProgress
            currentConfirmations={targetCurrentConfirmations}
            requiredConfirmations={targetRequiredConfirmations}
          />
        ) : undefined
    })

    return data
  }, [
    targetCurrentConfirmations,
    targetRequiredConfirmations,
    sourceCurrentConfirmations,
    sourceRequiredConfirmations,
    targetNetwork
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

  const renderFooter = useCallback(() => {
    return (
      <Button type="primary" size="large" onPress={back}>
        {isComplete ? 'Close' : 'Hide'}
      </Button>
    )
  }, [back, isComplete])

  return (
    <ScrollScreen
      title={`Bridging\nin progress...`}
      navigationTitle="Bridging in progress..."
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      <View sx={{ gap: 12, marginTop: 24 }}>
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
          {coingeckoId && assetPrices?.[coingeckoId] !== undefined && (
            <Text
              variant="subtitle2"
              sx={{ marginTop: 0, color: alpha(colors.$textPrimary, 0.9) }}>
              {amount &&
                formatCurrency({
                  amount: assetPrices[coingeckoId] * amount.toNumber()
                })}
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
    </ScrollScreen>
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
  currentConfirmations,
  requiredConfirmations
}: {
  currentConfirmations: number
  requiredConfirmations: number
}): JSX.Element | undefined => {
  const {
    theme: { colors }
  } = useTheme()

  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = (currentConfirmations + 1) / (requiredConfirmations + 1)
  }, [currentConfirmations, requiredConfirmations, progress])

  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (requiredConfirmations === 0) {
      return
    }

    if (currentConfirmations < requiredConfirmations) {
      setIsVisible(true)
    } else {
      setTimeout(() => {
        setIsVisible(false)
      }, 600)
    }
  }, [currentConfirmations, requiredConfirmations])

  if (!isVisible) {
    return undefined
  }

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
