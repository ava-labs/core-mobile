import { Button, Icons, Text, useTheme, View } from '@avalabs/k2-alpine'
import BackBarButton from 'common/components/BackBarButton'
import { ProgressDots } from 'common/components/ProgressDots'
import { withWalletConnectCache } from 'common/components/withWalletConnectCache'
import { useEffectiveHeaderHeight } from 'common/hooks/useEffectiveHeaderHeight'
import { router } from 'expo-router'
import { useDismissOnCancelledRequest } from 'features/approval/hooks/useDismissOnCancelledRequest'
import { useRecurringApprovalContext } from 'features/approval/hooks/useRecurringApprovalContext'
import { RecurrenceDetails } from 'features/approval/components/RecurrenceDetails'
import { useNetworks } from 'hooks/networks/useNetworks'
import { ActionSheet } from 'new/common/components/ActionSheet'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Platform } from 'react-native'
import { BatchApprovalScreenParams } from 'services/walletconnectv2/walletConnectCache/types'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'
import { AccountNetworkCard } from '../../components/AccountNetworkCard'
import BalanceChange from '../../components/BalanceChange/BalanceChange'
import { getHasBalanceChange } from '../ApprovalScreen/utils'
import { BatchTxStep } from './BatchTxStep'
import { useSpendLimitOverrides } from './useSpendLimitOverrides'

// Outer gate that hosts the malformed-RECURRING_SWAP short-circuit, mirroring
// ApprovalScreen. Because BatchApprovalScreen IS the recurring-swap surface, a
// malformed recurring context is a hard security invariant: render NOTHING
// approve-capable (return null) before the pager — and therefore the "Approve
// all" button — is ever reachable. Both components run their hooks
// unconditionally (rules-of-hooks safe): the outer runs its hooks, then either
// returns null or mounts the inner, which runs its own hooks unconditionally.
export const BatchApprovalScreen = ({
  params
}: {
  params: BatchApprovalScreenParams
}): JSX.Element | null => {
  const { onReject } = params

  const rejectAndClose = useCallback(
    (message?: string) => {
      onReject(message)
      if (router.canGoBack()) {
        router.back()
      } else if (router.canDismiss()) {
        router.dismissAll()
      }
    },
    [onReject]
  )

  // Gesture / hardware-back dismissal path. The native swipe (and Android
  // hardware back) already pop this sheet, so this must ONLY reject the pending
  // request — it must NOT navigate. `rejectAndClose`'s extra `router.back()`
  // would pop a second time and dismiss the screen underneath (e.g. the Swap
  // sheet that opened this approval), which is why swiping down used to close
  // Swap too. (CP-14641)
  const rejectRequest = useCallback(
    (message?: string) => onReject(message),
    [onReject]
  )

  const { recurringContext, isRecurringContextMalformed } =
    useRecurringApprovalContext(params.request, rejectAndClose)

  // Defensive: the signer never produces a zero-tx batch (the
  // eth_sendTransactionBatch handler enforces >= 2 txs), but guard it here so
  // the inner screen's `signingRequests[0]` reads never hand `undefined` (cast
  // to SigningData) to `useGasless`. Reject + close in an effect (mirroring the
  // malformed-context path above) so a violated invariant can't hang the
  // pending request behind a blank sheet, then return null as a render guard.
  const isEmptyBatch = params.signingRequests.length === 0
  useEffect(() => {
    if (isEmptyBatch) {
      rejectAndClose('Batch approval received no transactions')
    }
  }, [isEmptyBatch, rejectAndClose])

  if (isRecurringContextMalformed) return null

  if (isEmptyBatch) return null

  return (
    <BatchApprovalScreenInner
      params={params}
      recurringContext={recurringContext}
      rejectAndClose={rejectAndClose}
      rejectRequest={rejectRequest}
    />
  )
}

const BatchApprovalScreenInner = ({
  params: { request, displayData, signingRequests, signal, onApprove },
  recurringContext,
  rejectAndClose,
  rejectRequest
}: {
  params: BatchApprovalScreenParams
  recurringContext: ReturnType<
    typeof useRecurringApprovalContext
  >['recurringContext']
  rejectAndClose: (message?: string) => void
  rejectRequest: (message?: string) => void
}): JSX.Element | null => {
  useDismissOnCancelledRequest(signal)

  const {
    theme: { colors }
  } = useTheme()
  const headerHeight = useEffectiveHeaderHeight()

  const { overrides, setOverride } = useSpendLimitOverrides()

  const [page, setPage] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const txCount = signingRequests.length

  // Neither the batch's aggregate displayData nor the per-step displayData carry
  // account/network (they're display-only simulation metadata the batch
  // aggregator leaves empty). Derive them from the actual signing inputs instead
  // — the same sources the single-tx ApprovalScreen uses:
  //   - account: every EthSendTx signingData carries the signer address as a
  //     required field, and all txs in a batch share one signer (software-wallet
  //     same-account only).
  //   - network: resolved from the request's CAIP-2 chainId.
  const { getNetwork } = useNetworks()
  const numericChainId = getChainIdFromCaip2(request.chainId)
  const network = getNetwork(numericChainId)
  const overviewAccount =
    displayData.account ?? signingRequests[0]?.signingData.account
  const overviewNetwork =
    displayData.network ??
    (network && {
      name: network.chainName,
      logoUri: network.logoUri,
      chainId: network.chainId
    })

  // The overview token card should read as a plain "you pay X → you get Y"
  // summary, plus the one-time native schedule fee. Two adjustments to the
  // aggregate balance change:
  //   1. Flatten each diff to single-item diffs so the card renders flat rows
  //      instead of a collapsible/expandable group.
  //   2. Drop conversion legs — a movement whose amount (`displayValue`)
  //      appears on BOTH sides is a wrap/unwrap mechanic, not user-facing: the
  //      AVAX→WAVAX wrap principal has a matching WAVAX inflow, and the WAVAX
  //      intermediate is produced then spent at the same amount. What survives
  //      on each side is exactly what the user cares about: the from-token they
  //      pay and the one-time schedule fee (unmatched OUTflows), and the
  //      to-token they receive (an unmatched INflow — e.g. AVAX on USDC → AVAX).
  //      This mirrors BatchTxStep's matched/unmatched split, so the schedule
  //      fee shows here exactly as it does on the per-step screens.
  // The full per-step breakdown stays available under "See details".
  const overviewBalanceChange = useMemo(() => {
    const bc = displayData.balanceChange
    if (!bc) return undefined
    const flatten = (diffs: typeof bc.outs): typeof bc.outs =>
      diffs.flatMap(diff =>
        diff.items.map(item => ({ ...diff, items: [item] }))
      )
    const flatOuts = flatten(bc.outs)
    const flatIns = flatten(bc.ins)
    const inflowValues = new Set(
      flatIns.map(diff => diff.items[0]?.displayValue)
    )
    const outflowValues = new Set(
      flatOuts.map(diff => diff.items[0]?.displayValue)
    )
    const outs = flatOuts.filter(
      diff => !inflowValues.has(diff.items[0]?.displayValue)
    )
    const ins = flatIns.filter(
      diff => !outflowValues.has(diff.items[0]?.displayValue)
    )
    return { ...bc, outs, ins }
  }, [displayData.balanceChange])

  // Gasless ("Get free gas") is intentionally NOT offered on the batch screen:
  // the single-tx funding hook (`onSigned`, between sign and broadcast) has no
  // batch equivalent — mobile signs the batch and hands the signed txs to the
  // EVM module to broadcast, with no pre-broadcast funding step — so a toggle
  // here would be a no-op that misleads the user into expecting free gas. Hide
  // it until real batch broadcast-path funding lands. (CP-14641)

  const handleApproveAll = useCallback((): void => {
    // Re-entrancy guard: `onApprove` is fire-and-forget — the controller drives
    // the async signing while this screen navigates away and unmounts — so we
    // intentionally never reset `submitting`. It stays true for the life of the
    // screen, keeping the confirm button in its `isLoading` state and blocking a
    // second tap until the screen is gone.
    if (submitting) return
    setSubmitting(true)
    onApprove(overrides)
    if (router.canGoBack()) {
      router.back()
    } else if (router.canDismiss()) {
      router.dismissAll()
    }
  }, [submitting, onApprove, overrides])

  const alert = displayData.alert
    ? {
        type: displayData.alert.type,
        message: displayData.alert.details.description
      }
    : undefined

  const handleSeeDetails = useCallback(() => setPage(1), [])
  const handleNext = useCallback(() => setPage(p => p + 1), [])
  const handlePrevious = useCallback(() => setPage(p => p - 1), [])

  // Progress dots span the stepper — the numbered tx steps (1..txCount) plus
  // the final confirm (txCount + 1) — but not the overview (page 0).
  // `currentStep` is 0-indexed within that range, so page 1 → dot 0 and the
  // final confirm → the last dot.
  const progressDotsOverlay = useMemo(
    () => (
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: headerHeight
        }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: Platform.OS === 'ios' ? 15 : 50
          }}>
          <ProgressDots totalSteps={txCount + 1} currentStep={page - 1} />
        </View>
      </View>
    ),
    [headerHeight, txCount, page]
  )

  // Header back button. The overview (page 0) shows no back button — it's the
  // entry screen (dismiss via gesture or Reject). Every later screen steps one
  // page back, replacing the old bottom "Previous" button.
  const renderHeaderLeft = useCallback(
    () => (page === 0 ? null : <BackBarButton onBack={handlePrevious} />),
    [page, handlePrevious]
  )

  if (page === 0) {
    return (
      <ActionSheet
        isModal
        title="Approve transactions"
        renderHeaderLeft={renderHeaderLeft}
        onClose={rejectRequest}
        alert={alert}
        confirm={{
          label: 'Approve all',
          onPress: handleApproveAll,
          isLoading: submitting
        }}
        cancel={{
          label: 'Reject',
          onPress: rejectAndClose,
          disabled: submitting
        }}>
        {getHasBalanceChange(overviewBalanceChange) &&
          overviewBalanceChange && (
            <BalanceChange balanceChange={overviewBalanceChange} />
          )}
        <AccountNetworkCard
          account={overviewAccount}
          network={overviewNetwork}
        />
        <View style={{ alignSelf: 'center', marginTop: 12 }}>
          <Button
            size="medium"
            type="secondary"
            testID="see_details_button"
            onPress={handleSeeDetails}>
            See details
          </Button>
        </View>
        {recurringContext && (
          <View style={{ marginTop: 12 }}>
            <RecurrenceDetails context={recurringContext} />
          </View>
        )}
      </ActionSheet>
    )
  }

  if (page >= 1 && page <= txCount) {
    const index = page - 1
    const signingRequest = signingRequests[index]
    if (!signingRequest) return null

    return (
      <ActionSheet
        isModal
        title={`Transaction ${page} of ${txCount}`}
        showNavigationHeaderTitle={false}
        headerCenterOverlay={progressDotsOverlay}
        renderHeaderLeft={renderHeaderLeft}
        onClose={rejectRequest}
        confirm={{
          label: 'Next',
          onPress: handleNext
        }}>
        {/* `key={index}` is load-bearing: BatchTxStep owns per-tx
            `useSpendLimits` state (incl. `hashedCustomSpend`). Without a
            per-step key React reuses ONE instance across every step, so an
            edited spend limit's calldata survives into the next step and its
            `onOverride` effect (which re-fires when `index` changes) would
            register the previous step's calldata against the new index —
            signing a corrupted tx. Keying by index remounts the step so its
            hook state resets. (CP-14641) */}
        <BatchTxStep
          key={index}
          index={index}
          signingRequest={signingRequest}
          chainId={numericChainId}
          disabled={submitting}
          initialOverride={overrides[index]}
          onOverride={setOverride}
        />
      </ActionSheet>
    )
  }

  // Final confirm page (page === txCount + 1). The confirm frame centers the
  // help icon above the question, then repeats the account/network summary so
  // the user can confirm what they're signing before approving. It's the last
  // step of the stepper, so it carries the progress dots too.
  return (
    <ActionSheet
      isModal
      centerContent
      showNavigationHeaderTitle={false}
      headerCenterOverlay={progressDotsOverlay}
      renderHeaderLeft={renderHeaderLeft}
      onClose={rejectRequest}
      alert={alert}
      confirm={{
        label: 'Approve all',
        onPress: handleApproveAll,
        isLoading: submitting
      }}
      cancel={{
        label: 'Reject',
        onPress: rejectAndClose,
        disabled: submitting
      }}>
      <View sx={{ alignItems: 'center', gap: 20 }}>
        <Icons.Action.Help color={colors.$textPrimary} width={63} height={63} />
        <Text
          variant="heading3"
          sx={{
            color: '$textPrimary',
            textAlign: 'center',
            alignSelf: 'center'
          }}>
          Do you want to approve all transactions?
        </Text>
      </View>
    </ActionSheet>
  )
}

export default withWalletConnectCache('batchApprovalParams')(
  BatchApprovalScreen
)
