import React, { useMemo, useCallback, useState, useEffect } from 'react'
import {
  ActivityIndicator,
  Button,
  CircularButton,
  Icons,
  SafeAreaView,
  ScrollView,
  Separator,
  showAlert,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import ScreenHeader from 'common/components/ScreenHeader'
import {
  bigintToBig
  //  resolve
} from '@avalabs/core-utils-sdk'
import { KeyboardAvoidingView } from 'common/components/KeyboardAvoidingView'
import { useGlobalSearchParams, useRouter } from 'expo-router'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { TokenInputWidget } from 'common/components/TokenInputWidget'
import useBridge from 'screens/bridge/hooks/useBridge'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import Logger from 'utils/Logger'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import {
  selectIsHallidayBridgeBannerBlocked,
  selectIsGaslessBlocked
} from 'store/posthog'
import { useSelector } from 'react-redux'
import { SelectNetworkRow } from 'features/bridge/components/SelectNetworkRow'
import { BridgeAsset, TokenType } from '@avalabs/bridge-unified'
import { Network } from '@avalabs/core-chains-sdk'
import {
  unwrapAssetSymbol,
  wrapAssetSymbol
} from 'screens/bridge/utils/bridgeUtils'
import { NetworkVMType } from '@avalabs/vm-module-types'
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition
} from 'react-native-reanimated'
import { RootState } from 'store'
import { selectAvailableNativeTokenBalanceForNetworkAndAccount } from 'store/balance'
import { selectActiveAccount } from 'store/account'
import GaslessService from 'services/gasless/GaslessService'
import { AssetBalance } from 'screens/bridge/utils/types'
import BridgeTypeFootnote from 'features/bridge/components/BridgeTypeFootnote'
// import AnalyticsService from 'services/analytics/AnalyticsService'
// import { isUserRejectedError } from 'store/rpc/providers/walletConnect/utils'
// import { audioFeedback, Audios } from 'utils/AudioFeedback'
// import { getJsonRpcErrorMessage } from 'utils/getJsonRpcErrorMessage/getJsonRpcErrorMessage'
import {
  useBridgeSelectedAsset,
  useBridgeSelectedSourceNetwork,
  useBridgeSelectedTargetNetwork
} from 'features/bridge/store/store'
import { selectHasBeenViewedOnce, ViewOnceKey } from 'store/viewOnce'
import { HallidayBanner } from 'features/bridge/components/HallidayBanner'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { HALLIDAY_BRIDGE_URL } from 'features/bridge/const'

const BridgeScreen = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { initialSourceNetworkChainId, initialTokenSymbol } =
    useGlobalSearchParams<{
      initialSourceNetworkChainId?: string
      initialTokenSymbol?: string
    }>()
  const { navigate } = useRouter()
  const {
    sourceNetworks,
    assetBalance,
    inputAmount,
    setInputAmount,
    assetsWithBalances,
    networkFee,
    price,
    maximum,
    minimum,
    // transfer,
    // bridgeFee,
    bridgeType,
    amount,
    targetNetworks,
    sourceNetwork,
    setSourceNetwork,
    targetNetwork,
    setTargetNetwork,
    bridgeAssets,
    selectedBridgeAsset,
    setSelectedBridgeAsset,
    error,
    estimatedReceiveAmount,
    selectedAssetInSourceNetwork,
    selectedAssetInTargetNetwork
  } = useBridge()
  const [bridgeError, setBridgeError] = useState('')

  const [isPending /*, setIsPending*/] = useState<boolean>(false)
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false)

  const isAmountTooLow = amount !== 0n && minimum && amount < minimum
  const isAmountTooLarge = amount !== 0n && maximum && amount > maximum
  const isGaslessBlocked = useSelector(selectIsGaslessBlocked)
  const [isGaslessEligible, setIsGaslessEligible] = useState(false)
  const activeAccount = useSelector(selectActiveAccount)
  const hasBeenViewedHallidayBanner = useSelector(
    selectHasBeenViewedOnce(ViewOnceKey.HALLIDAY_BANNER)
  )
  const isHallidayBannerBlocked = useSelector(
    selectIsHallidayBridgeBannerBlocked
  )
  const shouldShowHallidayBanner =
    !hasBeenViewedHallidayBanner && !isHallidayBannerBlocked

  const [selectedSourceNetwork, setSelectedSourceNetwork] =
    useBridgeSelectedSourceNetwork()
  const [selectedTargetNetwork, setSelectedTargetNetwork] =
    useBridgeSelectedTargetNetwork()
  const [selectedAsset, setSelectedAsset] = useBridgeSelectedAsset()

  const [previousConfig, setPreviousConfig] = useState<{
    sourceNetwork: Network
    bridgeAsset: BridgeAsset | undefined
  }>()

  const hasValidAmount = useMemo(
    () => !isAmountTooLow && amount > 0n,
    [isAmountTooLow, amount]
  )
  const hasInvalidReceiveAmount = useMemo(
    () =>
      hasValidAmount &&
      estimatedReceiveAmount !== undefined &&
      estimatedReceiveAmount === 0n,
    [hasValidAmount, estimatedReceiveAmount]
  )
  const nativeTokenBalance = useSelector((state: RootState) =>
    selectAvailableNativeTokenBalanceForNetworkAndAccount(
      state,
      sourceNetwork?.chainId,
      activeAccount?.index
    )
  )

  const isNativeBalanceNotEnoughForNetworkFee = useMemo(() => {
    const shouldCheckNativeBalance = isGaslessBlocked || !isGaslessEligible

    return Boolean(
      shouldCheckNativeBalance &&
        amount !== 0n &&
        networkFee &&
        nativeTokenBalance <
          networkFee +
            (assetBalance?.asset.type === TokenType.NATIVE ? amount : 0n)
    )
  }, [
    amount,
    networkFee,
    nativeTokenBalance,
    assetBalance,
    isGaslessBlocked,
    isGaslessEligible
  ])

  const transferDisabled =
    isPending ||
    isAmountTooLow ||
    isAmountTooLarge ||
    isNativeBalanceNotEnoughForNetworkFee ||
    amount === 0n ||
    hasInvalidReceiveAmount

  const { formatCurrency } = useFormatCurrency()
  const cChainNetwork = useCChainNetwork()

  const handleAmountChange = useCallback(
    (value: bigint) => {
      const bigValue = value
      if (bridgeError) {
        setBridgeError('')
      }
      try {
        setInputAmount(bigValue)
      } catch (e) {
        Logger.error('failed to set amount', e)
      }
    },
    [setInputAmount, bridgeError]
  )

  const handleTransfer = async (): Promise<void> => {
    showAlert({
      title: 'Coming soon',
      description: 'This feature is not yet available.',
      buttons: [{ text: 'OK', style: 'cancel' }]
    })
    // if (
    //   amount === 0n ||
    //   !sourceNetwork ||
    //   !targetNetwork ||
    //   !selectedBridgeAsset
    // ) {
    //   return
    // }
    // AnalyticsService.capture('BridgeTransferStarted', {
    //   sourceBlockchain: sourceNetwork.chainName,
    //   targetBlockchain: targetNetwork.chainName
    // })
    // try {
    //   setIsPending(true)
    //   const [hash, transferError] = await resolve(transfer())
    //   setIsPending(false)
    //   if (transferError || !hash) {
    //     // do not show the error when the user denied the transfer
    //     if (isUserRejectedError(transferError)) {
    //       Logger.error('failed to bridge', transferError)
    //       AnalyticsService.capture('BridgeTransferRequestUserRejectedError', {
    //         sourceBlockchain: sourceNetwork.chainName,
    //         targetBlockchain: targetNetwork.chainName,
    //         fee: bigintToBig(bridgeFee, selectedBridgeAsset.decimals).toNumber()
    //       })
    //       return
    //     }
    //     transferError instanceof Error && setBridgeError(transferError.message)
    //     showAlert({
    //       title: 'Error',
    //       description: getJsonRpcErrorMessage(transferError),
    //       buttons: [{ text: 'OK', style: 'cancel' }]
    //     })
    //     Logger.error('[Bridge error]', transferError)
    //     AnalyticsService.capture('BridgeTransferRequestError', {
    //       sourceBlockchain: sourceNetwork.chainName,
    //       targetBlockchain: targetNetwork.chainName
    //     })
    //     return
    //   }
    //   audioFeedback(Audios.Send)
    //   // Navigate to transaction status page
    //   navigate(AppNavigation.Bridge.BridgeTransactionStatus, {
    //     txHash: hash ?? ''
    //   })
    //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // } catch (e: any) {
    //   const errorMessage =
    //     'reason' in e
    //       ? e?.reason
    //       : e?.message ??
    //         'An unknown error has occurred. Bridging was halted. Please try again later'
    //   showAlert({
    //     title: 'Error Bridging',
    //     description: errorMessage,
    //     buttons: [{ text: 'OK', style: 'cancel' }]
    //   })
    //   AnalyticsService.capture('BridgeTokenSelectError', {
    //     errorMessage
    //   })
    //   return
    // } finally {
    //   setIsPending(false)
    // }
  }

  const handleSelectToken = useCallback(() => {
    if (sourceNetwork === undefined) {
      return
    }

    setSelectedAsset(selectedBridgeAsset)
    navigate({
      pathname: '/selectBridgeToken',
      params: { sourceNetworkChainId: sourceNetwork.chainId }
    })
  }, [navigate, sourceNetwork, selectedBridgeAsset, setSelectedAsset])

  const handleSelectBridgeAsset = useCallback(
    (token: AssetBalance): void => {
      setSelectedBridgeAsset(token.asset)
    },
    [setSelectedBridgeAsset]
  )

  const formatInCurrency = useCallback(
    (value: bigint | undefined): string => {
      if (selectedBridgeAsset && !price) {
        return UNKNOWN_AMOUNT
      }

      return formatCurrency({
        amount:
          selectedBridgeAsset && price
            ? price
                .mul(bigintToBig(value ?? 0n, selectedBridgeAsset.decimals))
                .toNumber()
            : 0
      })
    },
    [formatCurrency, price, selectedBridgeAsset]
  )

  const handleSelectSourceNetwork = useCallback((): void => {
    setSelectedSourceNetwork(sourceNetwork)
    navigate({ pathname: '/selectBridgeSourceNetwork' })
  }, [setSelectedSourceNetwork, sourceNetwork, navigate])

  const handleSelectTargetNetwork = useCallback((): void => {
    if (selectedBridgeAsset === undefined) {
      return
    }

    setSelectedTargetNetwork(targetNetwork)
    navigate({
      pathname: '/selectBridgeTargetNetwork',
      params: {
        targetChainIds: JSON.stringify(
          Object.keys(selectedBridgeAsset.destinations)
        )
      }
    })
  }, [selectedBridgeAsset, setSelectedTargetNetwork, targetNetwork, navigate])

  const handleToggleNetwork = (): void => {
    if (targetNetwork && sourceNetwork) {
      setPreviousConfig({
        sourceNetwork: sourceNetwork,
        bridgeAsset: selectedBridgeAsset
      })
      setSourceNetwork(targetNetwork)
    }
  }

  const handlePressHallidayBanner = async (): Promise<void> => {
    AnalyticsService.capture('HallidayBuyClicked')
    navigate({
      pathname: 'webView',
      params: { url: HALLIDAY_BRIDGE_URL, testID: 'halliday-bridge-webview' }
    })
  }

  const errorMessage = useMemo(() => {
    if (amount === 0n || !selectedBridgeAsset) return undefined

    if (isAmountTooLow)
      return `Amount too low -- minimum is ${bigintToBig(
        minimum,
        selectedBridgeAsset.decimals
      )?.toFixed(9)}`

    if (isAmountTooLarge) return 'Insufficient balance'

    if (bridgeError) return bridgeError

    if (hasInvalidReceiveAmount) return `Receive amount can't be 0`

    if (isNativeBalanceNotEnoughForNetworkFee) {
      return `Insufficient balance to cover gas costs. Please add ${sourceNetwork?.networkToken.symbol}.`
    }

    return undefined
  }, [
    amount,
    bridgeError,
    isAmountTooLarge,
    isAmountTooLow,
    minimum,
    hasInvalidReceiveAmount,
    isNativeBalanceNotEnoughForNetworkFee,
    selectedBridgeAsset,
    sourceNetwork
  ])

  const renderFromSection = useCallback(() => {
    return (
      <Animated.View
        style={{
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: colors.$surfaceSecondary
        }}
        layout={LinearTransition}>
        <SelectNetworkRow
          title="From"
          network={sourceNetwork}
          onPress={handleSelectSourceNetwork}
        />
        <Separator sx={{ marginHorizontal: 16 }} />
        <TokenInputWidget
          amount={inputAmount}
          balance={selectedAssetInSourceNetwork?.balance}
          shouldShowBalance={true}
          title="You pay"
          token={selectedAssetInSourceNetwork}
          network={sourceNetwork}
          formatInCurrency={formatInCurrency}
          onAmountChange={handleAmountChange}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          onSelectToken={handleSelectToken}
          maximum={maximum}
          inputTextColor={errorMessage ? colors.$textDanger : undefined}
        />
      </Animated.View>
    )
  }, [
    colors,
    errorMessage,
    formatInCurrency,
    handleAmountChange,
    handleSelectToken,
    handleSelectSourceNetwork,
    inputAmount,
    selectedAssetInSourceNetwork,
    sourceNetwork,
    maximum
  ])

  const renderToSection = useCallback((): JSX.Element => {
    const receiveAmount =
      hasValidAmount && estimatedReceiveAmount && selectedBridgeAsset
        ? estimatedReceiveAmount
        : undefined

    return (
      <Animated.View
        style={{
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: colors.$surfaceSecondary
        }}
        layout={LinearTransition}>
        <SelectNetworkRow
          title="To"
          network={targetNetwork}
          onPress={
            targetNetworks.length > 1 ? handleSelectTargetNetwork : undefined
          }
        />
        <Separator sx={{ marginHorizontal: 16 }} />
        <TokenInputWidget
          amount={receiveAmount}
          balance={selectedAssetInTargetNetwork?.balance}
          title="You receive"
          token={selectedAssetInTargetNetwork}
          network={targetNetwork}
          formatInCurrency={formatInCurrency}
          onAmountChange={handleAmountChange}
          editable={false}
        />
      </Animated.View>
    )
  }, [
    colors,
    formatInCurrency,
    handleAmountChange,
    handleSelectTargetNetwork,
    selectedAssetInTargetNetwork,
    targetNetwork,
    targetNetworks,
    hasValidAmount,
    estimatedReceiveAmount,
    selectedBridgeAsset
  ])

  useEffect(() => {
    if (
      initialSourceNetworkChainId &&
      initialTokenSymbol &&
      !selectedBridgeAsset
    ) {
      const initialSourceNetwork = sourceNetworks.find(
        network => network.chainId === Number(initialSourceNetworkChainId)
      )
      if (initialSourceNetwork) {
        setSourceNetwork(initialSourceNetwork)
        const token = assetsWithBalances?.find(
          tk => (tk.symbolOnNetwork ?? tk.symbol) === initialTokenSymbol
        )
        if (token) {
          handleSelectBridgeAsset(token)
        }
      }
    }
  }, [
    initialSourceNetworkChainId,
    initialTokenSymbol,
    assetsWithBalances,
    handleSelectBridgeAsset,
    selectedBridgeAsset,
    setSourceNetwork,
    sourceNetworks
  ])

  useEffect(() => {
    if (error) {
      setBridgeError(error.message)
    }
  }, [error])

  useEffect(() => {
    const checkGaslessEligibility = async (): Promise<void> => {
      if (!sourceNetwork?.chainId || !selectedBridgeAsset) {
        setIsGaslessEligible(false)
        return
      }

      try {
        const isEligible = await GaslessService.isEligibleForChain(
          sourceNetwork.chainId.toString()
        )
        setIsGaslessEligible(isEligible)
      } catch (err) {
        Logger.error(`[Bridge.tsx][checkGaslessEligibility]${err}`)
        setIsGaslessEligible(false)
      }
    }

    checkGaslessEligibility()
  }, [sourceNetwork?.chainId, selectedBridgeAsset])

  useEffect(() => {
    if (!sourceNetwork) return

    // Reset because a denomination change will change its value
    setInputAmount(undefined)
  }, [sourceNetwork, setInputAmount])

  useEffect(() => {
    if (selectedSourceNetwork) {
      setSourceNetwork(selectedSourceNetwork)
    }
  }, [selectedSourceNetwork, setSourceNetwork])

  useEffect(() => {
    if (selectedTargetNetwork) {
      setTargetNetwork(selectedTargetNetwork)
    }
  }, [selectedTargetNetwork, setTargetNetwork])

  useEffect(() => {
    return () => {
      setSelectedSourceNetwork(undefined)
      setSelectedTargetNetwork(undefined)
      setSelectedAsset(undefined)
    }
  }, [setSelectedSourceNetwork, setSelectedTargetNetwork, setSelectedAsset])

  useEffect(() => {
    if (selectedAsset) {
      setSelectedBridgeAsset(selectedAsset)
    }
  }, [selectedAsset, setSelectedBridgeAsset])

  useEffect(() => {
    if (previousConfig?.bridgeAsset) {
      const bridgeAssetSymbol = unwrapAssetSymbol(
        previousConfig.bridgeAsset.symbol
      )

      const postfix =
        previousConfig.sourceNetwork.vmName === NetworkVMType.BITCOIN
          ? '.b'
          : '.e'

      const bridgeAsset =
        bridgeAssets.find(asset => asset.symbol === bridgeAssetSymbol) ??
        bridgeAssets.find(
          asset => asset.symbol === wrapAssetSymbol(bridgeAssetSymbol, postfix)
        )

      if (bridgeAsset) {
        setSelectedBridgeAsset(bridgeAsset)
      }
    }
  }, [previousConfig, setSelectedBridgeAsset, bridgeAssets, setInputAmount])

  useEffect(() => {
    if (
      previousConfig?.sourceNetwork &&
      targetNetworks.findIndex(
        network => network.chainId === previousConfig.sourceNetwork.chainId
      ) !== -1
    ) {
      setTargetNetwork(previousConfig.sourceNetwork)

      setPreviousConfig(undefined)
    }
  }, [
    selectedBridgeAsset,
    previousConfig?.sourceNetwork,
    targetNetworks,
    setTargetNetwork,
    setPreviousConfig,
    setInputAmount
  ])

  useEffect(() => {
    if (!initialSourceNetworkChainId && cChainNetwork) {
      setSourceNetwork(cChainNetwork)
    }
  }, [setSourceNetwork, cChainNetwork, initialSourceNetworkChainId])

  useEffect(() => {
    const bridgeTokenList = (assetsWithBalances ?? []).filter(asset =>
      bridgeAssets
        .map(bridgeAsset => bridgeAsset.symbol)
        .includes(asset.symbolOnNetwork ?? asset.asset.symbol)
    )

    if (
      bridgeTokenList.length === 1 &&
      bridgeTokenList[0]?.asset &&
      selectedBridgeAsset === undefined
    ) {
      setSelectedBridgeAsset(bridgeTokenList[0].asset)
    }
  }, [
    bridgeAssets,
    assetsWithBalances,
    setSelectedBridgeAsset,
    selectedBridgeAsset,
    cChainNetwork,
    sourceNetwork
  ])

  return (
    <KeyboardAvoidingView>
      <SafeAreaView sx={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerSx={{ padding: 16, paddingTop: 0 }}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="always">
          <ScreenHeader title="Bridge" />
          {shouldShowHallidayBanner && (
            <View sx={{ marginTop: 16, marginBottom: 8 }}>
              <HallidayBanner onPress={handlePressHallidayBanner} />
            </View>
          )}
          <Animated.View style={{ marginTop: 16 }} layout={LinearTransition}>
            {renderFromSection()}
            {errorMessage && (
              <Animated.View entering={FadeIn} exiting={FadeOut}>
                <Text
                  variant="caption"
                  sx={{
                    color: colors.$textDanger,
                    alignSelf: 'center',
                    marginVertical: 8
                  }}>
                  {errorMessage}
                </Text>
              </Animated.View>
            )}
            {isInputFocused ? (
              <Animated.View style={{ height: 12 }} layout={LinearTransition} />
            ) : (
              <Animated.View layout={LinearTransition}>
                <CircularButton
                  style={{
                    width: 40,
                    height: 40,
                    marginVertical: 8,
                    alignSelf: 'center'
                  }}
                  onPress={handleToggleNetwork}>
                  <Icons.Custom.SwapVertical color="red" />
                </CircularButton>
              </Animated.View>
            )}
            {renderToSection()}
          </Animated.View>
        </ScrollView>
        <View
          sx={{
            padding: 16,
            gap: 20
          }}>
          <Button
            type="primary"
            size="large"
            onPress={handleTransfer}
            disabled={transferDisabled}>
            {isPending ? <ActivityIndicator /> : 'Bridge'}
          </Button>
          {bridgeType && <BridgeTypeFootnote bridgeType={bridgeType} />}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
}

export default BridgeScreen
