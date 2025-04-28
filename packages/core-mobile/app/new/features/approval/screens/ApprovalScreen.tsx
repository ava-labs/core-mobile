import React, {
  useCallback,
  useState,
  useEffect,
  useLayoutEffect,
  useMemo
} from 'react'
import { LayoutChangeEvent, ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'
import { Separator, showAlert, Text, View } from '@avalabs/k2-alpine'
import { TokenLogo } from 'new/common/components/TokenLogo'
import { ApprovalParams } from 'services/walletconnectv2/walletConnectCache/types'
import { walletConnectCache } from 'services/walletconnectv2/walletConnectCache/walletConnectCache'
import Logger from 'utils/Logger'
import { useGasless } from 'hooks/useGasless'
import { selectAccountByIndex } from 'store/account/slice'
import { selectAccountByAddress } from 'store/account/slice'
import { useNativeTokenWithBalance } from 'screens/send/hooks/useNativeTokenWithBalance'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'
import { selectActiveAccount } from 'store/account/slice'
import { selectIsSeedlessSigningBlocked } from 'store/posthog/slice'
import { useSelector } from 'react-redux'
import { useNetworks } from 'hooks/networks/useNetworks'
import { isInAppRequest } from 'store/rpc/utils/isInAppRequest'
import { validateFee } from 'screens/send/utils/evm/validate'
import { SendErrorMessage } from 'screens/send/utils/types'
import { router, useLocalSearchParams } from 'expo-router'
import { Eip1559Fees } from 'utils/Utils'
import { ActionSheet } from 'new/common/components/ActionSheet'
import ScreenHeader from 'new/common/components/ScreenHeader'
import { NavigationPresentationMode } from 'new/common/types'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSpendLimits } from 'hooks/useSpendLimits'
import { Warning } from 'new/common/components/Warning'
import { Details } from '../components/Details'
import { Network } from '../components/Network'
import { NetworkFeeSelectorWithGasless } from '../components/NetworkFeeSelectorWithGasless'
import { Account } from '../components/Account'
import BalanceChange from '../components/BalanceChange/BalanceChange'
import { SpendLimits } from '../components/SpendLimits/SpendLimits'

const ApprovalScreenWrapper = (): JSX.Element | null => {
  const [params, setParams] = useState<ApprovalParams>()

  useLayoutEffect(() => {
    setParams(walletConnectCache.approvalParams.get())
  }, [])

  if (!params) {
    return null
  }

  return <ApprovalScreen params={params} />
}

const ApprovalScreen = ({
  params: { request, displayData, signingData, onApprove, onReject }
}: {
  params: ApprovalParams
}): JSX.Element => {
  const insets = useSafeAreaInsets()
  const { presentationMode } = useLocalSearchParams()
  const isSeedlessSigningBlocked = useSelector(selectIsSeedlessSigningBlocked)
  const { getNetwork } = useNetworks()
  const caip2ChainId = request.chainId
  const chainId = getChainIdFromCaip2(caip2ChainId)
  const network = getNetwork(chainId)
  const [amountError, setAmountError] = useState<string | undefined>()
  const nativeToken = useNativeTokenWithBalance()

  const accountSelector =
    'account' in signingData
      ? selectAccountByAddress(signingData.account)
      : 'accountIndex' in signingData && signingData.accountIndex
      ? selectAccountByIndex(signingData.accountIndex)
      : selectActiveAccount

  const account = useSelector(accountSelector)
  const [submitting, setSubmitting] = useState(false)
  const [maxFeePerGas, setMaxFeePerGas] = useState<bigint | undefined>()
  const [maxPriorityFeePerGas, setMaxPriorityFeePerGas] = useState<
    bigint | undefined
  >()
  const {
    gaslessEnabled,
    setGaslessEnabled,
    shouldShowGaslessSwitch,
    gaslessError,
    handleGaslessTx
  } = useGasless({
    signingData,
    maxFeePerGas,
    caip2ChainId
  })

  const approveDisabled =
    !network ||
    !account ||
    (displayData.networkFeeSelector && maxFeePerGas === undefined) ||
    (displayData.networkFeeSelector && maxPriorityFeePerGas === undefined) ||
    submitting ||
    amountError !== undefined

  const { spendLimits, canEdit, updateSpendLimit, hashedCustomSpend } =
    useSpendLimits(displayData.tokenApprovals)

  const filteredSections = useMemo(() => {
    return displayData.details.map(detailSection => {
      if (detailSection.title !== 'Transaction Details') {
        return detailSection
      }

      const filteredItems = detailSection.items.filter(item => {
        if (typeof item === 'string') return true

        const isInAppWebsite =
          item.label.toLowerCase() === 'website' && isInAppRequest(request)

        return !isInAppWebsite
      })

      return { ...detailSection, items: filteredItems }
    })
  }, [displayData.details, request])

  const balanceChange = displayData.balanceChange
  const hasBalanceChange =
    balanceChange &&
    (balanceChange.ins.length > 0 || balanceChange.outs.length > 0)

  const rejectAndClose = useCallback(
    (message?: string) => {
      onReject(message)
      router.canGoBack() && router.back()
    },
    [onReject]
  )

  const handleApprove = useCallback(async (): Promise<void> => {
    if (approveDisabled) return
    setSubmitting(true)

    if (shouldShowGaslessSwitch && gaslessEnabled) {
      const txHash = await handleGaslessTx(account.addressC)
      if (!txHash) {
        setSubmitting(false)
        return
      }
    }

    try {
      await onApprove({
        network,
        account,
        maxFeePerGas,
        maxPriorityFeePerGas,
        overrideData: hashedCustomSpend
      })
      router.canGoBack() && router.back()
    } catch (error: unknown) {
      Logger.error('Error approving transaction', error)
    } finally {
      setSubmitting(false)
    }
  }, [
    account,
    approveDisabled,
    gaslessEnabled,
    handleGaslessTx,
    maxFeePerGas,
    maxPriorityFeePerGas,
    network,
    onApprove,
    shouldShowGaslessSwitch,
    hashedCustomSpend
  ])

  const validateEthSendTransaction = useCallback(() => {
    if (
      !signingData ||
      !network?.networkToken ||
      !nativeToken ||
      signingData.type !== 'eth_sendTransaction'
    )
      return
    const ethSendTx = signingData.data

    try {
      const gasLimit = ethSendTx.gasLimit ? BigInt(ethSendTx.gasLimit) : 0n
      const amount = ethSendTx.value ? BigInt(ethSendTx.value) : 0n

      validateFee({
        gasLimit,
        maxFee: maxFeePerGas || 0n,
        amount,
        nativeToken,
        token: nativeToken
      })

      setAmountError(undefined)
    } catch (err) {
      if (err instanceof Error) {
        setAmountError(err.message)
      } else {
        setAmountError(SendErrorMessage.UNKNOWN_ERROR)
      }
    }
  }, [signingData, network, maxFeePerGas, nativeToken])

  const handleFeesChange = useCallback((fees: Eip1559Fees) => {
    setMaxFeePerGas(fees.maxFeePerGas)
    setMaxPriorityFeePerGas(fees.maxPriorityFeePerGas)
  }, [])

  useEffect(() => {
    if (isSeedlessSigningBlocked) {
      showAlert({
        title: 'Signing Temporarily Unavailable',
        description:
          'Signing is currently under maintenance.\n\nPlease try again shortly.',
        buttons: [
          {
            text: 'Got it',
            onPress: rejectAndClose
          }
        ]
      })
    }
  }, [isSeedlessSigningBlocked, rejectAndClose])

  useEffect(() => {
    if (gaslessEnabled) {
      setAmountError(undefined)
      return
    }
    validateEthSendTransaction()
  }, [validateEthSendTransaction, gaslessEnabled])

  const renderGaslessAlert = useCallback((): JSX.Element | null => {
    if (gaslessError === null || gaslessError.length === 0) return null

    return (
      <Warning
        message={gaslessError}
        sx={{ marginBottom: 12, marginRight: 16 }}
      />
    )
  }, [gaslessError])

  const renderTitle = useCallback(
    (
      title: string,
      handleHeaderLayout: (event: LayoutChangeEvent) => void,
      animatedHeaderStyle: ViewStyle
    ): JSX.Element | null => {
      return (
        <Animated.View
          onLayout={handleHeaderLayout}
          style={[
            {
              marginBottom: 32,
              marginTop: -10,
              width: '80%'
            },
            animatedHeaderStyle
          ]}>
          <ScreenHeader title={title} />
        </Animated.View>
      )
    },
    []
  )

  const renderDappInfo = useCallback(
    (
      dAppInfo: {
        name: string
        action: string
        logoUri?: string
      },
      handleHeaderLayout: (event: LayoutChangeEvent) => void
    ): JSX.Element | null => {
      const { action, logoUri } = dAppInfo

      return (
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 36
          }}>
          <View onLayout={handleHeaderLayout}>
            <TokenLogo logoUri={logoUri} size={62} />
          </View>
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 21
            }}>
            <Text
              variant="body1"
              sx={{
                textAlign: 'center',
                fontSize: 15,
                lineHeight: 20,
                fontWeight: '500',
                color: '$textPrimary'
              }}>
              {action}
            </Text>
          </View>
        </View>
      )
    },
    []
  )

  const renderDappInfoOrTitle = useCallback(
    (
      handleHeaderLayout: (event: LayoutChangeEvent) => void,
      animatedHeaderStyle: ViewStyle
    ): JSX.Element | null => {
      // prioritize rendering dAppInfo over title if both are present
      // we only want to render one of them
      if (displayData.dAppInfo)
        return renderDappInfo(displayData.dAppInfo, handleHeaderLayout)

      if (displayData.title)
        return renderTitle(
          displayData.title,
          handleHeaderLayout,
          animatedHeaderStyle
        )

      return null
    },
    [displayData.dAppInfo, displayData.title, renderDappInfo, renderTitle]
  )

  const renderAccountAndNetwork = useCallback((): JSX.Element | undefined => {
    if (displayData.account && displayData.network) {
      return (
        <View
          sx={{
            backgroundColor: '$surfaceSecondary',
            borderRadius: 12
          }}>
          <Account address={displayData.account} />
          <Separator sx={{ marginHorizontal: 16 }} />
          <Network
            logoUri={displayData.network.logoUri}
            name={displayData.network.name}
          />
        </View>
      )
    }

    if (displayData.network) {
      return (
        <Network
          logoUri={displayData.network.logoUri}
          name={displayData.network.name}
        />
      )
    }

    if (displayData.account) {
      return <Account address={displayData.account} />
    }
  }, [displayData.account, displayData.network])

  const renderDetails = useCallback((): JSX.Element => {
    return (
      <View
        style={{
          marginTop: 12,
          gap: 12
        }}>
        {filteredSections.map((detailSection, index) => (
          <Details key={index} detailSection={detailSection} />
        ))}
      </View>
    )
  }, [filteredSections])

  const renderBalanceChange = useCallback((): JSX.Element | null => {
    if (!hasBalanceChange) return null

    return <BalanceChange balanceChange={balanceChange} />
  }, [balanceChange, hasBalanceChange])

  const renderSpendLimits = (): JSX.Element | null => {
    if (spendLimits.length === 0 || hasBalanceChange) {
      return null
    }

    return (
      <SpendLimits
        spendLimits={spendLimits}
        onSelect={canEdit ? updateSpendLimit : undefined}
      />
    )
  }

  const renderNetworkFeeSelectorWithGasless =
    useCallback((): JSX.Element | null => {
      if (!displayData.networkFeeSelector) return null

      let gasLimit: number | undefined

      if (
        typeof signingData.data === 'object' &&
        'gasLimit' in signingData.data
      ) {
        gasLimit = Number(signingData.data.gasLimit || 0)
      }

      return (
        <View sx={{ marginTop: 12 }}>
          <NetworkFeeSelectorWithGasless
            gaslessEnabled={gaslessEnabled}
            setGaslessEnabled={setGaslessEnabled}
            gasLimit={gasLimit}
            caip2ChainId={caip2ChainId}
            handleFeesChange={handleFeesChange}
            shouldShowGaslessSwitch={shouldShowGaslessSwitch}
          />
        </View>
      )
    }, [
      caip2ChainId,
      displayData.networkFeeSelector,
      gaslessEnabled,
      setGaslessEnabled,
      shouldShowGaslessSwitch,
      signingData.data,
      handleFeesChange
    ])

  const alert = displayData.alert
    ? {
        type: displayData.alert.type,
        message: displayData.alert.details.description
      }
    : undefined

  const marginBottom =
    presentationMode === NavigationPresentationMode.FORM_SHEET
      ? insets.bottom
      : 0

  return (
    <ActionSheet
      sx={{
        marginBottom
      }}
      title={displayData.title}
      onClose={onReject}
      alert={alert}
      confirm={{
        label: 'Approve',
        onPress: handleApprove,
        disabled: approveDisabled
      }}
      cancel={{
        label: 'Reject',
        onPress: rejectAndClose,
        disabled: submitting
      }}>
      {({ handleHeaderLayout, animatedHeaderStyle }) => {
        return (
          <>
            {renderDappInfoOrTitle(handleHeaderLayout, animatedHeaderStyle)}
            {renderGaslessAlert()}
            {renderAccountAndNetwork()}
            {renderBalanceChange()}
            {renderDetails()}
            {renderSpendLimits()}
            {renderNetworkFeeSelectorWithGasless()}
          </>
        )
      }}
    </ActionSheet>
  )
}

export default ApprovalScreenWrapper
