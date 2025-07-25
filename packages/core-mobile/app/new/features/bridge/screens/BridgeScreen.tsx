import { BridgeAsset, TokenType } from '@avalabs/bridge-unified'
import { Network } from '@avalabs/core-chains-sdk'
import { bigintToBig, resolve } from '@avalabs/core-utils-sdk'
import {
  ActivityIndicator,
  Button,
  CircularButton,
  Icons,
  Separator,
  showAlert,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { NetworkVMType } from '@avalabs/vm-module-types'
import { useNavigation } from '@react-navigation/native'
import { TokenInputWidget } from 'common/components/TokenInputWidget'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { usePreventScreenRemoval } from 'common/hooks/usePreventScreenRemoval'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useGlobalSearchParams, useRouter } from 'expo-router'
import BridgeTypeFootnote from 'features/bridge/components/BridgeTypeFootnote'
import { HallidayBanner } from 'features/bridge/components/HallidayBanner'
import { SelectNetworkRow } from 'features/bridge/components/SelectNetworkRow'
import { HALLIDAY_BRIDGE_URL } from 'features/bridge/const'
import {
  useBridgeSelectedAsset,
  useBridgeSelectedSourceNetwork,
  useBridgeSelectedTargetNetwork
} from 'features/bridge/store/store'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition
} from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import {
  unwrapAssetSymbol,
  wrapAssetSymbol,
  AssetBalance
} from 'common/utils/bridgeUtils'
import AnalyticsService from 'services/analytics/AnalyticsService'
import GaslessService from 'services/gasless/GaslessService'
import { RootState } from 'store/types'
import { selectActiveAccount } from 'store/account'
import { selectAvailableNativeTokenBalanceForNetworkAndAccount } from 'store/balance'
import {
  selectIsGaslessBlocked,
  selectIsHallidayBridgeBannerBlocked
} from 'store/posthog'
import { isUserRejectedError } from 'store/rpc/providers/walletConnect/utils'
import { selectHasBeenViewedOnce, ViewOnceKey } from 'store/viewOnce'
import { audioFeedback, Audios } from 'utils/AudioFeedback'
import Logger from 'utils/Logger'
import { getJsonRpcErrorMessage } from 'utils/getJsonRpcErrorMessage/getJsonRpcErrorMessage'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useCoreBrowser } from 'common/hooks/useCoreBrowser'
import useBridge, { TokenWithBalanceInNetwork } from '../hooks/useBridge'

export const BridgeScreen = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { initialSourceNetworkChainId, initialTokenSymbol } =
    useGlobalSearchParams<{
      initialSourceNetworkChainId?: string
      initialTokenSymbol?: string
    }>()
  const { navigate, back, canGoBack } = useRouter()
  const { getState } = useNavigation()
  const { openUrl } = useCoreBrowser()
  const {
    sourceNetworks,
    assetBalance,
    inputAmount,
    setInputAmount,
    assetsWithBalances,
    networkFee,
    maximum,
    minimum,
    transfer,
    bridgeFee,
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

  const [isPending, setIsPending] = useState<boolean>(false)
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
      activeAccount?.id
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

  const [bridgeResult, setBridgeResult] = useState<{
    txHash: string
    chainId: number
  }>()
  useEffect(() => {
    if (bridgeResult) {
      audioFeedback(Audios.Send)
      back()
      const state = getState()
      if (state?.routes[state?.index ?? 0]?.name === 'onboarding') {
        canGoBack() && back()
      }
      navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/bridgeStatus',
        params: bridgeResult
      })
    }
  }, [bridgeResult, back, navigate, getState, canGoBack])

  const handleTransfer = useCallback(async () => {
    if (
      amount === 0n ||
      !sourceNetwork ||
      !targetNetwork ||
      !selectedBridgeAsset
    ) {
      return
    }
    AnalyticsService.capture('BridgeTransferStarted', {
      sourceBlockchain: sourceNetwork.chainName,
      targetBlockchain: targetNetwork.chainName
    })
    try {
      setIsPending(true)
      const [txHash, transferError] = await resolve(transfer())
      setIsPending(false)
      if (transferError || !txHash) {
        // do not show the error when the user denied the transfer
        if (isUserRejectedError(transferError)) {
          Logger.error('failed to bridge', transferError)
          AnalyticsService.capture('BridgeTransferRequestUserRejectedError', {
            sourceBlockchain: sourceNetwork.chainName,
            targetBlockchain: targetNetwork.chainName,
            fee: bigintToBig(bridgeFee, selectedBridgeAsset.decimals).toNumber()
          })
          return
        }
        transferError instanceof Error && setBridgeError(transferError.message)
        showAlert({
          title: 'Error',
          description: getJsonRpcErrorMessage(transferError),
          buttons: [{ text: 'Got it' }]
        })
        Logger.error('[Bridge error]', transferError)
        AnalyticsService.capture('BridgeTransferRequestError', {
          sourceBlockchain: sourceNetwork.chainName,
          targetBlockchain: targetNetwork.chainName
        })
        return
      }

      setBridgeResult({
        txHash,
        chainId: sourceNetwork.chainId
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      const errorMessage =
        'reason' in e
          ? e?.reason
          : e?.message ??
            'An unknown error has occurred. Bridging was halted. Please try again later'
      showAlert({
        title: 'Error Bridging',
        description: errorMessage,
        buttons: [{ text: 'Got it' }]
      })
      AnalyticsService.capture('BridgeTokenSelectError', {
        errorMessage
      })
      return
    } finally {
      setIsPending(false)
    }
  }, [
    amount,
    bridgeFee,
    selectedBridgeAsset,
    sourceNetwork,
    targetNetwork,
    transfer
  ])

  const handleSelectToken = useCallback(() => {
    if (sourceNetwork === undefined) {
      return
    }

    setSelectedAsset(selectedBridgeAsset)
    navigate({
      // @ts-ignore TODO: make routes typesafe
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
    (
      value: bigint | undefined,
      assetInNetwork?: TokenWithBalanceInNetwork
    ): string => {
      if (selectedBridgeAsset === undefined) {
        return UNKNOWN_AMOUNT
      }

      if (
        assetInNetwork?.balanceInCurrency === undefined ||
        assetInNetwork?.balance === undefined
      ) {
        return UNKNOWN_AMOUNT
      }
      const amt =
        (assetInNetwork.balanceInCurrency /
          bigintToBig(
            assetInNetwork.balance ?? 0n,
            selectedBridgeAsset.decimals
          ).toNumber()) *
        bigintToBig(value ?? 0n, selectedBridgeAsset.decimals).toNumber()

      return formatCurrency({
        amount: amt
      })
    },
    [selectedBridgeAsset, formatCurrency]
  )

  const handleSelectSourceNetwork = useCallback((): void => {
    setSelectedSourceNetwork(sourceNetwork)
    // @ts-ignore TODO: make routes typesafe
    navigate({ pathname: '/selectBridgeSourceNetwork' })
  }, [setSelectedSourceNetwork, sourceNetwork, navigate])

  const handleSelectTargetNetwork = useCallback((): void => {
    if (selectedBridgeAsset === undefined) {
      return
    }

    setSelectedTargetNetwork(targetNetwork)
    navigate({
      // @ts-ignore TODO: make routes typesafe
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
    back()

    AnalyticsService.capture('HallidayBuyClicked')

    openUrl({ url: HALLIDAY_BRIDGE_URL, title: 'Halliday' })
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
          formatInCurrency={() =>
            formatInCurrency(inputAmount, selectedAssetInSourceNetwork)
          }
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
          formatInCurrency={() =>
            formatInCurrency(receiveAmount, selectedAssetInTargetNetwork)
          }
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
    if (!initialSourceNetworkChainId && cChainNetwork && !sourceNetwork) {
      setSourceNetwork(cChainNetwork)
    }
  }, [
    setSourceNetwork,
    cChainNetwork,
    initialSourceNetworkChainId,
    sourceNetwork
  ])

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

  usePreventScreenRemoval(isPending)

  const renderFooter = useCallback(() => {
    return (
      <View
        sx={{
          gap: 16
        }}>
        <Button
          testID={isPending ? 'pending_btn' : 'next_btn'}
          type="primary"
          size="large"
          onPress={handleTransfer}
          disabled={transferDisabled}>
          {isPending ? <ActivityIndicator /> : 'Next'}
        </Button>
        {bridgeType && <BridgeTypeFootnote bridgeType={bridgeType} />}
      </View>
    )
  }, [handleTransfer, isPending, transferDisabled, bridgeType])

  return (
    <ScrollScreen
      title="Bridge"
      renderFooter={renderFooter}
      isModal
      shouldAvoidKeyboard
      contentContainerStyle={{ padding: 16 }}>
      {shouldShowHallidayBanner && (
        <View
          style={{
            marginBottom: 24
          }}>
          <HallidayBanner onPress={handlePressHallidayBanner} />
        </View>
      )}
      <Animated.View layout={LinearTransition}>
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
              disabled={isPending}
              onPress={handleToggleNetwork}>
              <Icons.Custom.SwapVertical />
            </CircularButton>
          </Animated.View>
        )}
        {renderToSection()}
      </Animated.View>
    </ScrollScreen>
  )
}
