import { TokenUnit } from '@avalabs/core-utils-sdk'
import {
  ActivityIndicator,
  Button,
  GroupList,
  GroupListItem,
  showAlert,
  SlidingButton,
  Text,
  View
} from '@avalabs/k2-alpine'
import { UTCDate } from '@date-fns/utc'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { copyToClipboard } from 'common/utils/clipboard'
import { transactionSnackbar } from 'common/utils/toast'
import {
  useDelegationContext,
  OnDelegationProgress
} from 'contexts/DelegationContext'
import { differenceInDays, format, getUnixTime } from 'date-fns'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { StakeTokenUnitValue } from 'features/stake/components/StakeTokenUnitValue'
import { useLedgerStaking } from 'features/stake/hooks/useLedgerStaking'
import { useStakeEstimatedReward } from 'features/stake/hooks/useStakeEstimatedReward'
import { useValidateStakingEndTime } from 'features/stake/utils/useValidateStakingEndTime'
import { useIssueDelegation } from 'hooks/earn/useIssueDelegation'
import { useRefreshStakingBalances } from 'hooks/earn/useRefreshStakingBalances'
import { useStakeAmount } from 'hooks/earn/useStakeAmount'
import useStakingParams from 'hooks/earn/useStakingParams'
import { useNow } from 'hooks/time/useNow'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { WalletType } from 'services/wallet/types'
import { selectActiveAccount } from 'store/account'
import { selectActiveWallet } from 'store/wallet/slice'
import { scheduleStakingCompleteNotifications } from 'store/notifications'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { isUserRejectedError } from 'store/rpc/providers/walletConnect/utils'
import NetworkService from 'services/network/NetworkService'
import { AdditionalDelegatorOutput } from 'services/wallet/types'
import { getExplorerAddressByNetwork } from 'utils/getExplorerAddressByNetwork'
import { truncateNodeId } from 'utils/Utils'
import { StakeStatusScreen } from '../components/StakeStatusScreen'
import { StakeReviewSource } from '../types'
import { formatFeePercent } from '../utils/formatFeePercent'
import { parseStakeEndTimeParam } from '../utils/parseStakeEndTimeParam'

// Auto-dismiss delay after the stake succeeds.
const SUCCESS_DISMISS_DELAY_MS = 2000

/**
 * V2 "Almost done, review your stake..." screen.
 *
 * Designed to be shared across staking flows (Fast Stake today; the
 * advanced delegate flow once it's built out). Data + fee policy come
 * from the `source` prop (validator resolution, convenience fee). Route
 * metadata that only affects analytics labeling (`isAdvanced`) is passed
 * as a sibling prop so it stays out of the source contract.
 *
 * The screen itself only deals with the parts that are universally
 * shared: reward computation, the review layout, the submit state
 * machine, the funds-stuck retry, and the post-submit screens.
 */
const StakeConfirmScreen = ({
  source,
  isAdvanced
}: {
  source: StakeReviewSource
  /**
   * Stamped onto `StakeDelegationSuccess` / `StakeDelegationFail`. `true`
   * when the user reached the confirm screen via the advanced delegate
   * path (they picked a specific node), `false` for the Fast Stake
   * auto-selection path.
   */
  isAdvanced: boolean
}): JSX.Element => {
  const { back, dismissAll } = useRouter()
  const navigation = useNavigation()
  const dispatch = useDispatch()
  // Drives the post-slide screens. `isSubmitting` latches when the user
  // slides to stake (non-ledger) so the processing screen stays up across
  // the whole network round-trip — deriving the phase from the mutation's
  // `isPending` instead would briefly flip back to the review screen in the
  // frame between `isPending` clearing and `isSuccess` being set.
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const [stakeAmount] = useStakeAmount()
  const { steps } = useDelegationContext()
  const { annualPercentageYieldBPS } = useStakingParams()
  const { stakeEndTime } = useLocalSearchParams<{ stakeEndTime: string }>()
  // Defensive parse — deep links / state restoration could land us here
  // with a missing or non-numeric `stakeEndTime`. Falling through with a
  // NaN would produce an Invalid Date and later crash inside `format()` /
  // `differenceInDays()`. When invalid we surface a dismiss-the-flow alert
  // below; the placeholder below keeps downstream date hooks running with
  // a finite value until the alert dismisses the modal.
  const parsedStakeEndTime = useMemo(
    () => parseStakeEndTimeParam(stakeEndTime),
    [stakeEndTime]
  )
  const isStakeEndTimeValid = parsedStakeEndTime !== undefined
  const stakeEndTimeInMilliseconds = useMemo(
    () => parsedStakeEndTime ?? new UTCDate(Date.now()),
    [parsedStakeEndTime]
  )
  const now = useNow()

  const {
    validator,
    isFetching: isFetchingValidator,
    error: validatorError,
    feePolicy
  } = source

  const activeAccount = useSelector(selectActiveAccount)
  const activeWallet = useSelector(selectActiveWallet)

  // `undefined` while the validator is still resolving — the hook now
  // skips the validator-end-time clamp in that case and returns the
  // user-selected end time as-is, so no callers need an ad-hoc sentinel
  // (e.g. `0`) here. Once the validator arrives, the clamp re-engages.
  const validatorEndTimeUnix = useMemo(
    () => (validator?.endTime ? Number(validator.endTime) : undefined),
    [validator?.endTime]
  )
  const { minStartTime, validatedStakingEndTime, validatedStakingDuration } =
    useValidateStakingEndTime(stakeEndTimeInMilliseconds, validatorEndTimeUnix)

  const localValidatedStakingEndTime = useMemo(() => {
    return new Date(validatedStakingEndTime.getTime())
  }, [validatedStakingEndTime])

  // Always estimate the gross reward (no validator-specific delegation fee
  // baked in). The convenience fee is applied below — only when the
  // `fast-stake-fee-enabled` flag is on — so the displayed reward stays
  // consistent with whether the fee is actually charged.
  //
  // `validatedStakingDuration` is now safe to use before the validator
  // resolves: with the `undefined` plumbing in `useValidateStakingEndTime`,
  // the duration reflects the user-selected end time during the resolve
  // window and switches to the validator-clamped end time once it arrives.
  // No consumer-level gating needed here.
  const grossEstimatedReward = useStakeEstimatedReward({
    amount: stakeAmount,
    duration: validatedStakingDuration,
    delegationFee: 0
  })
  const [isAlertVisible, setIsAlertVisible] = useState(false)

  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  // Convenience fee derived from the gross reward. The flow's
  // `feePolicy` decides whether and at what rate to charge — when it's
  // null (e.g. the advanced delegate flow), no fee is computed and the
  // user keeps the full gross estimate.
  const convenienceFee = useMemo<TokenUnit | undefined>(() => {
    const reward = grossEstimatedReward?.estimatedTokenReward
    if (!reward || !feePolicy || reward.toSubUnit() === 0n) {
      return undefined
    }
    return reward.mul(feePolicy.rate)
  }, [grossEstimatedReward?.estimatedTokenReward, feePolicy])

  // What the user actually sees as "Estimated reward": net of the
  // convenience fee when it applies, otherwise the gross estimate.
  const displayedReward = useMemo<TokenUnit | undefined>(() => {
    const reward = grossEstimatedReward?.estimatedTokenReward
    if (!reward) return undefined
    return convenienceFee ? reward.sub(convenienceFee) : reward
  }, [grossEstimatedReward?.estimatedTokenReward, convenienceFee])

  // Convenience-fee output bundled atomically with the delegation tx so the
  // fee is paid into the policy-defined escrow address(es) only if the
  // delegation itself succeeds. Skipped entirely when the flow has no
  // `feePolicy`.
  const feeAdditionalOutputs = useMemo<
    readonly AdditionalDelegatorOutput[] | undefined
  >(() => {
    if (!convenienceFee || !feePolicy) return undefined
    const amount = convenienceFee.toSubUnit()
    if (amount <= 0n) return undefined
    return [
      {
        addresses: feePolicy.recipientAddresses,
        amount
      }
    ]
  }, [convenienceFee, feePolicy])

  // Per-event analytics built from the route's `isAdvanced` flag and the
  // runtime-computed fee amount. `convenienceFeeAvax` is only added when
  // the flow actually applies a fee — keeps the "fee not paid" vs
  // "fee not applicable" distinction the analytics contract promises.
  const delegationAnalyticsProps = useMemo(
    () => ({
      isAdvanced,
      ...(feePolicy
        ? {
            convenienceFeeAvax: convenienceFee
              ? convenienceFee.toDisplay({ asNumber: true })
              : 0
          }
        : {})
    }),
    [isAdvanced, feePolicy, convenienceFee]
  )

  // Bundle captured on `StakeIssueDelegation`, which has a stricter shape
  // (no `isAdvanced`) than the success/fail events. Undefined when the
  // flow doesn't charge a fee, matching the analytics type's union arm.
  const issueDelegationAnalyticsProps = useMemo(() => {
    if (!feePolicy) return undefined
    return {
      convenienceFeeAvax: convenienceFee
        ? convenienceFee.toDisplay({ asNumber: true })
        : 0
    }
  }, [feePolicy, convenienceFee])

  // Percentage form of the fee rate, formatted for display so that
  // floating-point artifacts (e.g. `0.07 * 100 = 7.000000000000001`) don't
  // leak into the caption. Empty when no policy applies — the caption /
  // "Convenience fee" row are hidden in that case.
  const convenienceFeePercent = feePolicy
    ? formatFeePercent(feePolicy.rate)
    : ''

  const refreshStakingBalances = useRefreshStakingBalances()

  const isLedger =
    activeWallet?.type === WalletType.LEDGER ||
    activeWallet?.type === WalletType.LEDGER_LIVE

  const onLedgerCancelRef = useRef<(() => void) | undefined>(undefined)
  const { startLedgerDelegation, resetLedgerState, renderLedgerFooter } =
    useLedgerStaking(
      isLedger,
      useCallback(() => onLedgerCancelRef.current?.(), [])
    )

  const apyText = useMemo(
    () => `${(annualPercentageYieldBPS / 100).toFixed(2)}%`,
    [annualPercentageYieldBPS]
  )

  // Loading state is collapsed into a single boolean exposed by the
  // source hook — the screen doesn't need to know whether the underlying
  // query is `useFastStakeNode`, `useNodes`, or something else.
  const isResolvingValidator = isFetchingValidator || !validator

  // The convenience fee is *not* surfaced as its own row — the
  // `Estimated reward` already shows the net-of-fee amount and the
  // caption below this section discloses the Core fee percentage. This
  // keeps the breakdown short while still meeting the disclosure
  // requirement. The fee is of course still charged on-chain via
  // `feeAdditionalOutputs` and captured in analytics.
  const amountSection: GroupListItem[] = useMemo(
    () => [
      {
        title: 'Staked amount',
        value: <StakeTokenUnitValue value={stakeAmount} />
      },
      {
        title: 'APY',
        // Match the vertical rhythm of the StakeTokenUnitValue rows
        // (which carry their own marginVertical) so this row isn't thinner.
        value: (
          <Text variant="body1" sx={{ marginVertical: 15 }}>
            {apyText}
          </Text>
        )
      },
      {
        title: 'Estimated reward',
        value: <StakeTokenUnitValue value={displayedReward} isReward />
      }
    ],
    [stakeAmount, apyText, displayedReward]
  )

  const unlockSection: GroupListItem[] = useMemo(() => {
    return [
      {
        title: 'Time to unlock',
        value: isResolvingValidator ? (
          <ActivityIndicator />
        ) : (
          `${differenceInDays(validatedStakingEndTime, now)} days`
        )
      },
      {
        title: 'Locked until',
        value: isResolvingValidator ? (
          <ActivityIndicator />
        ) : (
          // Two-line date / time, matching the stake detail screen. The
          // vertical margin keeps the title centered against the taller
          // two-line value so the row doesn't look cramped.
          <View sx={{ alignItems: 'flex-end', marginVertical: 10 }}>
            <Text
              variant="body1"
              sx={{ color: '$textSecondary', fontSize: 16 }}>
              {format(localValidatedStakingEndTime, 'MM/dd/yyyy')}
            </Text>
            <Text
              variant="body1"
              sx={{ color: '$textSecondary', fontSize: 16 }}>
              {format(localValidatedStakingEndTime, 'h:mm aa')}
            </Text>
          </View>
        )
      }
    ]
  }, [
    isResolvingValidator,
    validatedStakingEndTime,
    localValidatedStakingEndTime,
    now
  ])

  const nodeSection: GroupListItem[] = useMemo(() => {
    if (isResolvingValidator) {
      return [
        {
          title: 'Node',
          subtitle: 'Searching Avalanche nodes...',
          value: <ActivityIndicator />
        }
      ]
    }

    const resolvedNodeId = validator?.nodeID ?? ''
    return [
      {
        title: 'Node',
        subtitle: truncateNodeId(resolvedNodeId, 14),
        accessory: (
          <Button
            size="small"
            type="secondary"
            onPress={() => copyToClipboard(resolvedNodeId)}>
            Copy
          </Button>
        ),
        onPress: () => copyToClipboard(resolvedNodeId)
      }
    ]
  }, [isResolvingValidator, validator?.nodeID])

  const handleStartOver = useCallback((): void => {
    dismissAll()
  }, [dismissAll])

  const handleDismiss = useCallback((): void => {
    dismissAll()
    back()
  }, [dismissAll, back])

  const onDelegationSuccess = useCallback(
    (txHash: string): void => {
      refreshStakingBalances({ shouldRefreshStakes: true })

      AnalyticsService.capture(
        'StakeDelegationSuccess',
        delegationAnalyticsProps
      )

      const pNetwork = NetworkService.getAvalancheNetworkP(isDeveloperMode)
      const explorerLink = pNetwork.explorerUrl
        ? getExplorerAddressByNetwork(pNetwork.explorerUrl, txHash, 'tx')
        : undefined
      transactionSnackbar.success({ message: 'New Stake Added', explorerLink })

      // Show the success screen instead of dismissing — the user closes the
      // modal themselves (swipe down), which returns them to the stake home.
      setIsSuccess(true)

      dispatch(
        scheduleStakingCompleteNotifications([
          {
            txHash,
            endTimestamp: getUnixTime(validatedStakingEndTime),
            accountId: activeAccount?.id,
            isDeveloperMode
          }
        ])
      )
    },
    [
      refreshStakingBalances,
      dispatch,
      validatedStakingEndTime,
      activeAccount?.id,
      isDeveloperMode,
      delegationAnalyticsProps
    ]
  )

  const onDelegationError = useCallback(
    (e: Error): void => {
      if (!isUserRejectedError(e)) {
        AnalyticsService.capture(
          'StakeDelegationFail',
          delegationAnalyticsProps
        )
      }

      // Drop back to the review screen so the user can retry.
      setIsSubmitting(false)
      resetLedgerState()

      const isInsufficientFunds =
        e.message.toLowerCase().includes('insufficient') ||
        e.message.toLowerCase().includes('not enough')

      if (isInsufficientFunds) {
        showAlert({
          title: 'Insufficient Funds',
          description:
            'You do not have enough AVAX to complete this stake. Please add more funds and try again.',
          buttons: [
            {
              text: 'OK',
              onPress: isLedger ? undefined : () => back()
            }
          ]
        })
      } else {
        showAlert({
          title: 'Stake Failed',
          description: e.message,
          buttons: [
            {
              text: 'OK',
              onPress: isLedger ? undefined : () => back()
            }
          ]
        })
      }
    },
    [back, isLedger, resetLedgerState, delegationAnalyticsProps]
  )

  const issueDelegationRef = useRef<
    | {
        (params: {
          nodeId: string
          startDate: Date
          endDate: Date
          recomputeSteps?: boolean
          onProgress?: OnDelegationProgress
          additionalOutputs?: readonly AdditionalDelegatorOutput[]
        }): Promise<void>
      }
    | undefined
  >(undefined)
  const validatorRef = useRef(validator)
  const minStartTimeRef = useRef(minStartTime)
  const validatedStakingEndTimeRef = useRef(validatedStakingEndTime)
  // Keep the latest fee output payload in a ref so the funds-stuck retry
  // path (which only has ref access to the current state) re-applies the
  // same convenience-fee output as the original attempt.
  const feeAdditionalOutputsRef = useRef(feeAdditionalOutputs)
  // Mirror the issue-delegation analytics props so retries report the
  // same fee context as the original submission.
  const issueDelegationAnalyticsPropsRef = useRef(issueDelegationAnalyticsProps)

  useEffect(() => {
    validatorRef.current = validator
    minStartTimeRef.current = minStartTime
    validatedStakingEndTimeRef.current = validatedStakingEndTime
    feeAdditionalOutputsRef.current = feeAdditionalOutputs
    issueDelegationAnalyticsPropsRef.current = issueDelegationAnalyticsProps
  }, [
    validator,
    minStartTime,
    validatedStakingEndTime,
    feeAdditionalOutputs,
    issueDelegationAnalyticsProps
  ])

  const onFundsStuck = useCallback(
    (_error: Error): void => {
      const performRetry = (onProgress?: OnDelegationProgress): void => {
        const currentValidator = validatorRef.current
        const currentMinStartTime = minStartTimeRef.current
        const currentValidatedStakingEndTime =
          validatedStakingEndTimeRef.current
        if (!currentValidator || !issueDelegationRef.current) return

        AnalyticsService.capture(
          'StakeIssueDelegation',
          issueDelegationAnalyticsPropsRef.current
        )
        issueDelegationRef.current({
          nodeId: currentValidator.nodeID,
          startDate: currentMinStartTime,
          endDate: currentValidatedStakingEndTime,
          recomputeSteps: true,
          onProgress,
          additionalOutputs: feeAdditionalOutputsRef.current
        })
      }

      showAlert({
        title: 'Funds stuck',
        description:
          'Your stake failed due to network issues. Would you like to keep trying to stake your funds?',
        buttons: [
          {
            text: 'Cancel stake',
            onPress: () => {
              handleDismiss()
            }
          },
          {
            text: 'Try again',
            onPress: () => {
              if (isLedger) {
                startLedgerDelegation(performRetry)
              } else {
                performRetry()
              }
            }
          }
        ]
      })
    },
    [handleDismiss, isLedger, startLedgerDelegation]
  )

  const {
    issueDelegation,
    isPending: isIssueDelegationPending,
    reset: resetIssueDelegation
  } = useIssueDelegation({
    onSuccess: onDelegationSuccess,
    onError: onDelegationError,
    onFundsStuck
  })
  onLedgerCancelRef.current = resetIssueDelegation

  useEffect(() => {
    issueDelegationRef.current = issueDelegation
  }, [issueDelegation])

  const handleDelegate = useCallback(
    (recomputeSteps = false): void => {
      if (!validator) return

      AnalyticsService.capture(
        'StakeIssueDelegation',
        issueDelegationAnalyticsProps
      )

      const performDelegation = (onProgress?: OnDelegationProgress): void => {
        issueDelegation({
          nodeId: validator.nodeID,
          startDate: minStartTime,
          endDate: validatedStakingEndTime,
          // The steps were first computed on the amount screen, before the
          // convenience fee was known. When a fee applies, force a recompute
          // so the import/transfer covers the extra escrow output too —
          // otherwise the delegation tx can't fund it and fails with an
          // insufficient-funds error (e.g. P-Chain balance == stake amount).
          recomputeSteps: recomputeSteps || feeAdditionalOutputs !== undefined,
          onProgress,
          additionalOutputs: feeAdditionalOutputs
        })
      }

      if (isLedger) {
        // Ledger keeps the review screen + signing footer; the processing
        // screen is only used for the non-ledger (seedless) path.
        startLedgerDelegation(performDelegation)
      } else {
        setIsSubmitting(true)
        performDelegation()
      }
    },
    [
      validator,
      isLedger,
      issueDelegation,
      minStartTime,
      validatedStakingEndTime,
      startLedgerDelegation,
      feeAdditionalOutputs,
      issueDelegationAnalyticsProps
    ]
  )

  // 'processing' once the delegation is in flight, 'success' once it
  // resolves; 'idle' is the reviewable state with the slide CTA.
  const phase: 'idle' | 'processing' | 'success' = isSuccess
    ? 'success'
    : isSubmitting
    ? 'processing'
    : 'idle'

  // Once we leave the review state, hide the back button (and the iOS
  // native back chevron) — the only way out of the processing/success
  // screens is swiping the modal down. The effect always sets options
  // both ways so a return to `idle` (e.g. after a non-ledger failure that
  // calls `setIsSubmitting(false)`) restores the back affordance instead
  // of leaving the user stranded on the review screen with no way out
  // besides swiping down.
  useEffect(() => {
    navigation.setOptions(
      phase === 'idle'
        ? // `undefined` tells react-navigation to fall back to the
          // screen's declared options (or the navigator's defaults).
          { headerLeft: undefined, headerBackVisible: true }
        : { headerLeft: () => null, headerBackVisible: false }
    )
  }, [phase, navigation])

  // Auto-close the entire stake flow shortly after success. Going back on
  // the parent navigator pops the whole addStakeV2 modal and returns to
  // wherever the flow was opened from. (`dismissAll()` only pops the inner
  // stack back to the chooser/start screen, which we don't want.)
  useEffect(() => {
    if (phase !== 'success') return
    const timeout = setTimeout(() => {
      navigation.getParent()?.goBack()
    }, SUCCESS_DISMISS_DELAY_MS)
    return () => clearTimeout(timeout)
  }, [phase, navigation])

  // Invalid `stakeEndTime` route param (deep link / state restoration with
  // a missing or NaN value). We can't proceed with a fake duration, so
  // surface a dedicated alert and dismiss the modal as soon as the user
  // acknowledges it. Distinct from the "No match found" path below because
  // the user has no way to fix this from inside the flow.
  useEffect(() => {
    if (phase !== 'idle' || isAlertVisible || isStakeEndTimeValid) return
    showAlert({
      title: 'Invalid stake duration',
      description:
        'Something went wrong while loading this stake. Please start over.',
      buttons: [
        {
          text: 'OK',
          onPress: handleDismiss
        }
      ]
    })
    setIsAlertVisible(true)
  }, [phase, isAlertVisible, isStakeEndTimeValid, handleDismiss])

  useEffect(() => {
    if (
      // Don't surface the "no match" alert once the stake is processing or done.
      phase === 'idle' &&
      !isAlertVisible &&
      // Skip the no-match path when the route param itself is invalid; the
      // dedicated invalid-duration alert above owns that case.
      isStakeEndTimeValid &&
      // Wait for the source to finish its lookup before deciding nothing
      // matched — otherwise the alert flashes while the query is still in
      // flight.
      !isFetchingValidator &&
      (validatorError || !validator)
    ) {
      showAlert({
        title: 'No match found',
        description:
          'Core was unable to find a node that matches your requirements. Please start over or try again later',
        buttons: [
          {
            text: 'Cancel',
            onPress: handleDismiss
          },
          {
            text: 'Start over',
            onPress: handleStartOver
          }
        ]
      })
      setIsAlertVisible(true)
    }
  }, [
    phase,
    validatorError,
    validator,
    handleStartOver,
    handleDismiss,
    isAlertVisible,
    isFetchingValidator,
    isStakeEndTimeValid
  ])

  // Submit must wait for the gross reward estimate to be available
  // whenever a fee policy applies. Without this guard the user can
  // slide-to-stake before the reward resolves — the tx would skip the
  // convenience-fee escrow output and analytics would record
  // `convenienceFeeAvax: 0` even though the UI advertised a fee.
  //
  // Gate on `grossEstimatedReward` rather than the derived
  // `feeAdditionalOutputs` so we don't lock the CTA in the (degenerate)
  // case where the reward genuinely rounds to 0 — there, no fee output is
  // expected, but the submission itself is still valid. When no policy
  // applies, the screen submits as soon as a validator is available,
  // matching the old behaviour for the advanced delegate flow.
  const isFeeContextReady = !feePolicy || grossEstimatedReward !== undefined

  const renderFooter = useCallback(() => {
    const ledgerFooter = renderLedgerFooter(steps.length)
    if (ledgerFooter) return ledgerFooter

    return (
      <SlidingButton
        mode="single"
        label="Slide to stake"
        loading={isIssueDelegationPending}
        disabled={!validator || !isFeeContextReady || isIssueDelegationPending}
        onConfirm={() => handleDelegate()}
      />
    )
  }, [
    renderLedgerFooter,
    steps.length,
    isIssueDelegationPending,
    validator,
    isFeeContextReady,
    handleDelegate
  ])

  if (phase !== 'idle') {
    return <StakeStatusScreen variant={phase} />
  }

  return (
    <ScrollScreen
      isModal
      title={`Almost done,\nreview your stake...`}
      navigationTitle="Review your stake"
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16 }}>
      <View sx={{ gap: 12, marginTop: 16 }}>
        <View sx={{ gap: 8 }}>
          <GroupList
            data={amountSection}
            separatorMarginRight={16}
            itemHeight={48}
          />
          {/* Caption is gated on `grossEstimatedReward` so the copy
              ("Rewards estimate includes...") only shows once an estimate
              is actually rendered in the row above. Otherwise the
              Estimated reward row reads "—" while the caption confidently
              talks about a non-existent estimate. */}
          {feePolicy && grossEstimatedReward && (
            <Text
              variant="caption"
              sx={{
                color: '$textSecondary',
                alignSelf: 'center',
                textAlign: 'center'
              }}>
              {`Rewards estimate includes a ${convenienceFeePercent}% Core fee`}
            </Text>
          )}
        </View>
        <GroupList
          data={unlockSection}
          separatorMarginRight={16}
          itemHeight={48}
        />
        <GroupList
          data={nodeSection}
          separatorMarginRight={16}
          itemHeight={48}
        />
      </View>
    </ScrollScreen>
  )
}

export default StakeConfirmScreen
