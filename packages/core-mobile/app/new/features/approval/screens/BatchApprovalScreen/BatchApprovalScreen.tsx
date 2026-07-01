import { Button, Separator, Text, View } from '@avalabs/k2-alpine'
import { NetworkTokenSymbols } from 'common/components/TokenIcon'
import { withWalletConnectCache } from 'common/components/withWalletConnectCache'
import { L2_NETWORK_SYMBOL_MAPPING } from 'consts/chainIdsWithIncorrectSymbol'
import { router } from 'expo-router'
import { useDismissOnCancelledRequest } from 'features/approval/hooks/useDismissOnCancelledRequest'
import { useRecurringApprovalContext } from 'features/approval/hooks/useRecurringApprovalContext'
import { RecurrenceDetails } from 'features/approval/components/RecurrenceDetails'
import { ActionSheet } from 'new/common/components/ActionSheet'
import React, { useCallback, useState } from 'react'
import { BatchApprovalScreenParams } from 'services/walletconnectv2/walletConnectCache/types'
import { Account } from '../../components/Account'
import { Network } from '../../components/Network'
import BalanceChange from '../../components/BalanceChange/BalanceChange'
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

  const { recurringContext, isRecurringContextMalformed } =
    useRecurringApprovalContext(params.request, rejectAndClose)

  if (isRecurringContextMalformed) return null

  return (
    <BatchApprovalScreenInner
      params={params}
      recurringContext={recurringContext}
      rejectAndClose={rejectAndClose}
    />
  )
}

const BatchApprovalScreenInner = ({
  params: { displayData, signingRequests, signal, onApprove },
  recurringContext,
  rejectAndClose
}: {
  params: BatchApprovalScreenParams
  recurringContext: ReturnType<
    typeof useRecurringApprovalContext
  >['recurringContext']
  rejectAndClose: (message?: string) => void
}): JSX.Element | null => {
  useDismissOnCancelledRequest(signal)

  const { overrides, setOverride } = useSpendLimitOverrides()

  const [page, setPage] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const txCount = signingRequests.length

  const chainId = displayData.network?.chainId
  const symbol = chainId
    ? (L2_NETWORK_SYMBOL_MAPPING[chainId] as NetworkTokenSymbols)
    : undefined

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

  if (page === 0) {
    return (
      <ActionSheet
        isModal
        title="Approve transactions"
        navigationTitle="Approve transactions"
        onClose={rejectAndClose}
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
        {displayData.balanceChange && (
          <BalanceChange balanceChange={displayData.balanceChange} />
        )}
        {recurringContext && <RecurrenceDetails context={recurringContext} />}
        {(displayData.account || displayData.network) && (
          <View
            sx={{
              backgroundColor: '$surfaceSecondary',
              borderRadius: 12,
              marginTop: 12
            }}>
            {displayData.account && <Account address={displayData.account} />}
            {displayData.account && displayData.network && (
              <Separator sx={{ marginHorizontal: 16 }} />
            )}
            {displayData.network && (
              <Network
                logoUri={displayData.network.logoUri}
                symbol={symbol}
                name={displayData.network.name}
                chainId={chainId}
              />
            )}
          </View>
        )}
        <Button
          size="large"
          type="secondary"
          style={{ marginTop: 12 }}
          testID="see_details_button"
          onPress={handleSeeDetails}>
          See details
        </Button>
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
        navigationTitle={`Transaction ${page} of ${txCount}`}
        onClose={rejectAndClose}
        confirm={{
          label: page < txCount ? 'Next' : 'Review',
          onPress: handleNext
        }}
        cancel={{
          label: 'Previous',
          onPress: handlePrevious,
          disabled: submitting
        }}>
        <BatchTxStep
          index={index}
          signingRequest={signingRequest}
          disabled={submitting}
          onOverride={setOverride}
        />
      </ActionSheet>
    )
  }

  // Final confirm page (page === txCount + 1). Per Figma the confirm frame shows
  // only the centered question — no separate collapsing title — so title /
  // navigationTitle are intentionally left undefined to avoid rendering the
  // sentence twice.
  return (
    <ActionSheet
      isModal
      onClose={rejectAndClose}
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
      <Text
        variant="heading6"
        sx={{ color: '$textPrimary', textAlign: 'center' }}>
        Do you want to approve all transactions?
      </Text>
    </ActionSheet>
  )
}

export default withWalletConnectCache('batchApprovalParams')(
  BatchApprovalScreen
)
