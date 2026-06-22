import { Separator, showAlert, Text, View } from '@avalabs/k2-alpine'
import { RpcMethod } from '@avalabs/vm-module-types'
import { NetworkTokenSymbols } from 'common/components/TokenIcon'
import { withWalletConnectCache } from 'common/components/withWalletConnectCache'
import { useActiveWallet } from 'common/hooks/useActiveWallet'
import { useLedgerApproval } from 'features/approval/hooks/useLedgerApproval'
import { useRecurringApprovalContext } from 'features/approval/hooks/useRecurringApprovalContext'
import { RecurrenceDetails } from 'features/approval/components/RecurrenceDetails'
import { dismissKeyboardIfNeeded } from 'common/utils/dismissKeyboardIfNeeded'
import { L2_NETWORK_SYMBOL_MAPPING } from 'consts/chainIdsWithIncorrectSymbol'
import { router } from 'expo-router'
import { useNativeTokenWithBalanceByNetwork } from 'features/send/hooks/useNativeTokenWithBalanceByNetwork'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useGasless } from 'hooks/useGasless'
import { useSpendLimits } from 'hooks/useSpendLimits'
import { ActionSheet } from 'new/common/components/ActionSheet'
import { AlertBody } from 'new/features/approval/components/AlertBody'
import { TokenLogo } from 'new/common/components/TokenLogo'
import { Warning } from 'new/common/components/Warning'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { ApprovalParams } from 'services/walletconnectv2/walletConnectCache/types'
import {
  selectIsGaslessInstantBlocked,
  selectIsSeedlessSigningBlocked
} from 'store/posthog/slice'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'
import { RequestContext } from 'store/rpc/types'
import Logger from 'utils/Logger'
import { Eip1559Fees } from 'utils/Utils'
import { selectIsWalletLedger } from 'store/wallet/slice'
import { Account } from '../../components/Account'
import BalanceChange from '../../components/BalanceChange/BalanceChange'
import { Details } from '../../components/Details'
import { Network } from '../../components/Network'
import { NetworkFeeSelectorWithGasless } from '../../components/NetworkFeeSelectorWithGasless'
import { SpendLimits } from '../../components/SpendLimits/SpendLimits'
import {
  getAccountSelector,
  getEthSendTxValidationError,
  getHasBalanceChange,
  getInitialGasLimit,
  overrideContractItem,
  removeWebsiteItemIfNecessary
} from './utils'

// Tiny outer gate that hosts the malformed-RECURRING_SWAP short-circuit.
// Splitting it out keeps the main render's cognitive complexity at its
// pre-existing limit — the `if (isMalformed) return null` is a security
// invariant (must short-circuit before Approve is reachable), not a render
// branch we want inlined into the main component's JSX.
const ApprovalScreen = (props: {
  params: ApprovalParams
}): JSX.Element | null => {
  const rejectAndClose = useCallback(
    (message?: string) => {
      props.params.onReject(message)
      if (router.canGoBack()) {
        router.back()
      } else if (router.canDismiss()) {
        router.dismissAll()
      }
    },
    [props.params.onReject]
  )
  const { recurringContext, isRecurringContextMalformed } =
    useRecurringApprovalContext(props.params.request, rejectAndClose)
  if (isRecurringContextMalformed) return null
  return (
    <ApprovalScreenInner
      params={props.params}
      recurringContext={recurringContext}
    />
  )
}

const ApprovalScreenInner = ({
  params: { request, displayData, signingData, onApprove, onReject },
  recurringContext
}: {
  params: ApprovalParams
  recurringContext: ReturnType<
    typeof useRecurringApprovalContext
  >['recurringContext']
}): JSX.Element => {
  const isSeedlessSigningBlocked = useSelector(selectIsSeedlessSigningBlocked)
  const { getNetwork } = useNetworks()
  const caip2ChainId = request.chainId
  const chainId = getChainIdFromCaip2(caip2ChainId)
  const network = getNetwork(chainId)
  const [amountError, setAmountError] = useState<string | undefined>()
  const nativeToken = useNativeTokenWithBalanceByNetwork(network)
  const activeWallet = useActiveWallet()
  const isLedger = useSelector(selectIsWalletLedger(activeWallet.id))
  const isGaslessInstantBlocked = useSelector(selectIsGaslessInstantBlocked)
  const { renderLedgerFooter, cancelLedger, dismissLedger, isLedgerActive } =
    useLedgerApproval(isLedger)

  const symbol = chainId
    ? (L2_NETWORK_SYMBOL_MAPPING[chainId] as NetworkTokenSymbols)
    : undefined

  const accountSelector = getAccountSelector(signingData, activeWallet.id)
  const account = useSelector(accountSelector)

  const [submitting, setSubmitting] = useState(false)
  const [gasLimit, setGasLimit] = useState<number | undefined>(
    getInitialGasLimit(signingData)
  )
  const [maxFeePerGas, setMaxFeePerGas] = useState<bigint | undefined>()
  const [maxPriorityFeePerGas, setMaxPriorityFeePerGas] = useState<
    bigint | undefined
  >()

  const { spendLimits, canEdit, updateSpendLimit, hashedCustomSpend } =
    useSpendLimits(displayData.tokenApprovals)

  const {
    gaslessEnabled,
    setGaslessEnabled,
    shouldShowGaslessSwitch,
    gaslessError,
    handleGaslessTx
  } = useGasless({
    signingData,
    maxFeePerGas,
    maxPriorityFeePerGas,
    gasLimit,
    overrideData: hashedCustomSpend,
    caip2ChainId
  })

  const approveDisabled =
    !network ||
    !account ||
    (displayData.networkFeeSelector && maxFeePerGas === undefined) ||
    (displayData.networkFeeSelector && maxPriorityFeePerGas === undefined) ||
    submitting ||
    amountError !== undefined

  const filteredSections = useMemo(() => {
    return displayData.details.map(detailSection => {
      if (detailSection.title !== 'Transaction Details') {
        return detailSection
      }

      const filteredItems = detailSection.items
        .filter(item => removeWebsiteItemIfNecessary(item, request))
        .map(item => overrideContractItem(item, request))

      return { ...detailSection, items: filteredItems }
    })
  }, [displayData.details, request])

  const balanceChange = displayData.balanceChange
  const hasBalanceChange = getHasBalanceChange(balanceChange)

  const rejectAndClose = useCallback(
    (message?: string) => {
      onReject(message)
      router.canGoBack() && router.back()
    },
    [onReject]
  )

  // When the sheet is closed via the X button or swipe (not the in-footer Cancel
  // button), cancelLedger ensures the userCancelledMap flag is set so any
  // in-flight resolveWithRetry skips the retry alert and any already-visible
  // retry alert's Retry button becomes a no-op.
  const handleClose = useCallback((): void => {
    if (isLedger) cancelLedger()
    onReject()
  }, [cancelLedger, isLedger, onReject])

  const handleApprove = useCallback(async (): Promise<void> => {
    if (approveDisabled) return
    setSubmitting(true)

    const isGasless = shouldShowGaslessSwitch && gaslessEnabled

    try {
      await onApprove({
        walletId: activeWallet.id,
        walletType: activeWallet.type,
        network,
        account,
        maxFeePerGas,
        maxPriorityFeePerGas,
        gasLimit,
        overrideData: hashedCustomSpend,
        // For gasless: fund after signing but before broadcasting.
        // This ensures the gas station is only called once we have
        // a signed tx, preventing wasted funding on rejected signs.
        onSigned: isGasless
          ? async () => {
              if (!account) return false
              request.context = {
                ...request.context,
                [RequestContext.SHOULD_RETRY]: !isGaslessInstantBlocked
              }
              const txHash = await handleGaslessTx(account.addressC)
              return !!txHash
            }
          : undefined
      })
      // For Ledger, the controller sets the store and navigation is handled
      // by ApprovalController.handleGoBackIfNeeded after signing completes
      if (!isLedger) {
        router.canGoBack() && router.back()
      }
    } catch (error: unknown) {
      Logger.error('Error approving transaction', error)
    } finally {
      setSubmitting(false)
    }
  }, [
    approveDisabled,
    shouldShowGaslessSwitch,
    gaslessEnabled,
    onApprove,
    activeWallet.id,
    activeWallet.type,
    network,
    account,
    maxFeePerGas,
    maxPriorityFeePerGas,
    gasLimit,
    hashedCustomSpend,
    isGaslessInstantBlocked,
    handleGaslessTx,
    request,
    isLedger
  ])

  const validateEthSendTransaction = useCallback(() => {
    if (
      !signingData ||
      !network?.networkToken ||
      !nativeToken ||
      signingData.type !== RpcMethod.ETH_SEND_TRANSACTION
    )
      return

    // Skip validation if gasless is enabled and available
    if (gaslessEnabled && shouldShowGaslessSwitch) {
      setAmountError(undefined)
      return
    }

    const error = getEthSendTxValidationError({
      gasLimit,
      maxFeePerGas,
      sendValue: signingData.data.value,
      nativeToken
    })
    setAmountError(error)
  }, [
    signingData,
    network?.networkToken,
    nativeToken,
    gaslessEnabled,
    shouldShowGaslessSwitch,
    gasLimit,
    maxFeePerGas
  ])

  const handleFeesChange = useCallback((fees: Eip1559Fees) => {
    setGasLimit(fees.gasLimit)
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

  // When gasless funding fails on a Ledger wallet, dismiss the Ledger review
  // footer so the regular Approve/Reject buttons reappear. The user can then
  // retry the transaction paying gas normally.
  useEffect(() => {
    if (gaslessError && isLedger) {
      dismissLedger()
    }
  }, [gaslessError, isLedger, dismissLedger])

  useEffect(() => {
    setTimeout(() => {
      dismissKeyboardIfNeeded()
    }, 0)
  }, [])

  const renderGaslessAlert = useCallback((): JSX.Element | null => {
    if (gaslessError === null || gaslessError.length === 0) return null

    return (
      <Warning
        message={gaslessError}
        sx={{ marginBottom: 12, marginRight: 16 }}
      />
    )
  }, [gaslessError])

  const renderDappInfo = useCallback(
    (dAppInfo: {
      name: string
      action: string
      logoUri?: string
    }): JSX.Element | null => {
      const { action, logoUri } = dAppInfo

      return (
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 36
          }}>
          <TokenLogo logoUri={logoUri} symbol={symbol} size={62} />
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
    [symbol]
  )

  const renderDappInfoOrTitle = useCallback((): JSX.Element | null => {
    // prioritize rendering dAppInfo over title if both are present
    // we only want to render one of them
    if (displayData.dAppInfo) return renderDappInfo(displayData.dAppInfo)

    return null
  }, [displayData.dAppInfo, renderDappInfo])

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
            symbol={symbol}
            name={displayData.network.name}
            chainId={chainId}
          />
        </View>
      )
    }

    if (displayData.network) {
      return (
        <Network
          logoUri={displayData.network.logoUri}
          symbol={symbol}
          name={displayData.network.name}
          chainId={chainId}
        />
      )
    }

    if (displayData.account) {
      return <Account address={displayData.account} />
    }
  }, [displayData.account, displayData.network, symbol, chainId])

  const renderDetails = useCallback((): JSX.Element => {
    return (
      <View>
        {filteredSections.map((detailSection, index) => (
          <Details key={index} detailSection={detailSection} symbol={symbol} />
        ))}
      </View>
    )
  }, [filteredSections, symbol])

  const renderBalanceChange = useCallback((): JSX.Element | null => {
    if (!hasBalanceChange || !balanceChange) return null

    return <BalanceChange balanceChange={balanceChange} />
  }, [balanceChange, hasBalanceChange])

  const renderSpendLimits = (): JSX.Element | null => {
    if (spendLimits.length === 0) {
      return null
    }

    return (
      <SpendLimits
        spendLimits={spendLimits}
        hasBalanceChange={hasBalanceChange}
        onSelect={
          canEdit && !submitting && !isLedgerActive
            ? updateSpendLimit
            : undefined
        }
      />
    )
  }

  const renderNetworkFeeSelectorWithGasless =
    useCallback((): JSX.Element | null => {
      if (!displayData.networkFeeSelector) return null

      return (
        <View sx={{ marginTop: 12 }}>
          <NetworkFeeSelectorWithGasless
            gaslessEnabled={gaslessEnabled}
            setGaslessEnabled={setGaslessEnabled}
            gasLimit={gasLimit}
            caip2ChainId={caip2ChainId}
            handleFeesChange={handleFeesChange}
            shouldShowGaslessSwitch={shouldShowGaslessSwitch}
            errorMessage={amountError}
          />
        </View>
      )
    }, [
      caip2ChainId,
      displayData.networkFeeSelector,
      gaslessEnabled,
      setGaslessEnabled,
      shouldShowGaslessSwitch,
      gasLimit,
      handleFeesChange,
      amountError
    ])

  const alert = displayData.alert
    ? {
        type: displayData.alert.type,
        message: displayData.alert.details.description
      }
    : undefined

  const renderAlertBody = useCallback((): JSX.Element | null => {
    const body = displayData.alert?.details.body
    if (!body || body.length === 0) return null

    return <AlertBody reasons={body} />
  }, [displayData.alert?.details.body])

  return (
    <ActionSheet
      isModal
      // disabled for now to avoid the issue with the scroll to confirm on approval screen
      // TODO: enable this once the issue is fixed
      // requireScrollToConfirm
      title={displayData.dAppInfo ? undefined : displayData.title}
      navigationTitle={
        displayData.dAppInfo ? displayData?.dAppInfo?.name : displayData.title
      }
      onClose={handleClose}
      alert={alert}
      confirm={{
        label: 'Approve',
        onPress: handleApprove,
        disabled: approveDisabled,
        isLoading: submitting
      }}
      cancel={{
        label: 'Reject',
        onPress: rejectAndClose,
        disabled: submitting
      }}
      renderFooterOverride={isLedger ? renderLedgerFooter : undefined}>
      {renderDappInfoOrTitle()}
      {renderGaslessAlert()}
      {renderBalanceChange()}
      {/* `RECURRING_SWAP` context is also injected by `EvmSigner.signOne` on
          the preceding ERC-20 spend-limit approval (when the recurring fill
          needs an allowance). Suppress the preview on that screen — the
          "Scheduling recurring swap" block belongs on the actual fill
          approval, not on the allowance step. `spendLimits.length > 0` is
          the discriminator: a non-empty list means this modal is the
          allowance approval, not the fill. */}
      {recurringContext && spendLimits.length === 0 && (
        <RecurrenceDetails context={recurringContext} />
      )}
      {renderSpendLimits()}
      {renderAccountAndNetwork()}
      {renderDetails()}
      {renderNetworkFeeSelectorWithGasless()}
      {renderAlertBody()}
    </ActionSheet>
  )
}

export default withWalletConnectCache('approvalParams')(ApprovalScreen)
