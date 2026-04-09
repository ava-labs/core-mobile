import { TokenUnit } from '@avalabs/core-utils-sdk'
import {
  ActivityIndicator,
  Button,
  GroupList,
  GroupListItem,
  showAlert,
  Text,
  TokenUnitInput,
  TokenUnitInputHandle,
  Tooltip,
  View
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { SendErrorMessage } from 'errors/sendError'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { usePreventScreenRemoval } from 'common/hooks/usePreventScreenRemoval'
import { transactionSnackbar } from 'common/utils/toast'
import { useRouter } from 'expo-router'
import { StakeTokenUnitValue } from 'features/stake/components/StakeTokenUnitValue'
import { useClaimRewards } from 'hooks/earn/useClaimRewards'
import { usePChainBalance } from 'hooks/earn/usePChainBalance'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import NetworkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useRefreshStakingBalances } from 'hooks/earn/useRefreshStakingBalances'
import { isUserRejectedError } from 'store/rpc/providers/walletConnect/utils'
import { useAvaxPrice } from 'features/portfolio/hooks/useAvaxPrice'
import { CONFETTI_DURATION_MS } from 'common/consts'
import { selectIsInAppReviewBlocked } from 'store/posthog/slice'
import { promptForAppReviewAfterSuccessfulTransaction } from 'features/appReview/utils/promptForAppReviewAfterSuccessfulTransaction'
import { WalletType } from 'services/wallet/types'
import { selectActiveWallet } from 'store/wallet/slice'
import { useLedgerClaimReward } from 'features/stake/hooks/useLedgerClaimReward'
import { OnDelegationProgress } from 'contexts/DelegationContext'

// Claim reward flow has 2 steps: Export from P-Chain + Import to C-Chain
const CLAIM_TOTAL_STEPS = 2

export const ClaimStakeRewardScreen = (): JSX.Element => {
  const isInAppReviewBlocked = useSelector(selectIsInAppReviewBlocked)
  const { navigate, back, dismissAll } = useRouter()
  const { formatTokenInCurrency } = useFormatCurrency()
  const pChainBalance = usePChainBalance()
  const ref = useRef<TokenUnitInputHandle>(null)
  const [claimableAmountInAvax, setClaimableAmountInAvax] =
    useState<TokenUnit>()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const activeWallet = useSelector(selectActiveWallet)
  const isLedger =
    activeWallet?.type === WalletType.LEDGER ||
    activeWallet?.type === WalletType.LEDGER_LIVE
  const pNetwork = NetworkService.getAvalancheNetworkP(isDeveloperMode)
  const avaxPrice = useAvaxPrice()
  const refreshStakingBalances = useRefreshStakingBalances()

  // Use a ref to break the circular dependency between useLedgerClaimReward and useClaimRewards
  const onLedgerCancelRef = useRef<(() => void) | undefined>(undefined)
  const { startLedgerClaimReward, resetLedgerState, renderLedgerFooter } =
    useLedgerClaimReward(
      isLedger,
      useCallback(() => onLedgerCancelRef.current?.(), [])
    )

  const onClaimSuccess = (): void => {
    refreshStakingBalances({ shouldRefreshStakes: false })

    AnalyticsService.capture('StakeClaimSuccess')

    transactionSnackbar.success({ message: 'Stake reward claimed' })
    dismissAll()

    setTimeout(() => {
      confetti.restart()
    }, 100)

    if (!isInAppReviewBlocked) {
      // Run the app-review prompt flow after confetti finishes
      setTimeout(() => {
        promptForAppReviewAfterSuccessfulTransaction()
      }, CONFETTI_DURATION_MS + 200)
    }
  }

  const onClaimError = (error: Error): void => {
    resetLedgerState()
    if (!isUserRejectedError(error)) {
      AnalyticsService.capture('StakeClaimFail', {
        errorMessage: error.message
      })
    }
    transactionSnackbar.error({ error: error.message })
  }

  const onFundsStuck = (): void => {
    showAlert({
      title: 'Claim Failed',
      description:
        'Your transaction failed due to network issues. Would you like to try again?',
      buttons: [
        {
          text: 'Cancel',
          onPress: back
        },
        {
          text: 'Try again',
          onPress: handleClaimNow
        }
      ]
    })
  }

  const {
    claimRewards,
    isPending: isClaimRewardsPending,
    reset: resetClaimRewards,
    totalFees,
    feeCalculationError
  } = useClaimRewards(onClaimSuccess, onClaimError, onFundsStuck)
  onLedgerCancelRef.current = resetClaimRewards

  const unableToGetFees = totalFees === undefined

  const insufficientBalanceForFee =
    feeCalculationError === SendErrorMessage.INSUFFICIENT_BALANCE_FOR_FEE

  const shouldDisableClaimButton =
    unableToGetFees || insufficientBalanceForFee || isClaimRewardsPending

  useEffect(() => {
    if (isClaimRewardsPending) return

    // the balance is usually updated faster than the tx "committed" event
    // and we don't want to show the updated balance while the tx is still pending (spinner is being displayed)
    // as that might confuse the user
    // thus, we only update the balance if the tx is not pending
    if (pChainBalance?.balancePerType.unlockedUnstaked) {
      const unlockedInUnit = new TokenUnit(
        pChainBalance.balancePerType.unlockedUnstaked,
        pNetwork.networkToken.decimals,
        pNetwork.networkToken.symbol
      )

      setClaimableAmountInAvax(unlockedInUnit)
    }
  }, [
    pChainBalance?.balancePerType.unlockedUnstaked,
    pNetwork.networkToken,
    isClaimRewardsPending
  ])

  const handleCancel = useCallback(() => {
    AnalyticsService.capture('StakeCancelClaim')

    // we call back() first and then navigate() to prevent rerendering the stake home screen when user is already on it.
    back()
    navigate('/stake')
  }, [back, navigate])

  const issueClaimRewards = useCallback(
    (onProgress?: OnDelegationProgress) => {
      AnalyticsService.capture('StakeIssueClaim')
      claimRewards(onProgress)
    },
    [claimRewards]
  )

  const handleClaimNow = useCallback(() => {
    if (isLedger) {
      startLedgerClaimReward(issueClaimRewards)
    } else {
      issueClaimRewards()
    }
  }, [isLedger, startLedgerClaimReward, issueClaimRewards])

  const formatInCurrency = useCallback(
    (amount: TokenUnit): string => {
      return formatTokenInCurrency({
        amount: amount.mul(avaxPrice).toDisplay({ asNumber: true })
      })
    },
    [avaxPrice, formatTokenInCurrency]
  )

  const feeData: GroupListItem[] = useMemo(() => {
    if (insufficientBalanceForFee) {
      return []
    }

    return [
      {
        title: 'Network fee',
        rightIcon: (
          <Tooltip
            title="Network fee"
            description="Fees paid to execute the transaction"
          />
        ),
        value:
          totalFees === undefined ? (
            <ActivityIndicator />
          ) : (
            <StakeTokenUnitValue value={totalFees} />
          )
      }
    ]
  }, [totalFees, insufficientBalanceForFee])

  usePreventScreenRemoval(isClaimRewardsPending)

  useEffect(() => {
    if (claimableAmountInAvax) {
      ref.current?.setValue(claimableAmountInAvax.toDisplay())
    }
  }, [claimableAmountInAvax])

  useEffect(() => {
    if (
      pChainBalance &&
      pChainBalance.balancePerType.unlockedUnstaked === undefined
    ) {
      showAlert({
        title: 'No claimable balance',
        description: 'You have no balance available for claiming.',
        buttons: [{ text: 'Go back', onPress: back }]
      })
    }
  }, [pChainBalance, back])

  const renderFooter = useCallback(() => {
    const ledgerFooter = renderLedgerFooter(CLAIM_TOTAL_STEPS)
    if (ledgerFooter) return ledgerFooter

    return (
      <View
        sx={{
          gap: 16
        }}>
        <Button
          testID={shouldDisableClaimButton ? 'claim_now_disabled' : 'claim_now'}
          accessible={true}
          type="primary"
          size="large"
          onPress={handleClaimNow}
          disabled={shouldDisableClaimButton}>
          {isClaimRewardsPending ? <ActivityIndicator /> : 'Claim now'}
        </Button>
        <Button
          type="tertiary"
          size="large"
          onPress={handleCancel}
          disabled={isClaimRewardsPending}>
          Cancel
        </Button>
      </View>
    )
  }, [
    renderLedgerFooter,
    isClaimRewardsPending,
    handleCancel,
    handleClaimNow,
    shouldDisableClaimButton
  ])

  return (
    <ScrollScreen
      title="Claim your stake reward"
      isModal
      renderFooter={renderFooter}
      shouldAvoidKeyboard
      contentContainerStyle={{
        padding: 16
      }}>
      <View sx={{ gap: 12 }}>
        <View>
          <View
            sx={{
              backgroundColor: '$surfaceSecondary',
              paddingVertical: 30,
              paddingHorizontal: 16,
              borderRadius: 12
            }}>
            <TokenUnitInput
              ref={ref}
              amount={claimableAmountInAvax}
              editable={false}
              token={{
                maxDecimals: pNetwork.networkToken.decimals,
                symbol: pNetwork.networkToken.symbol
              }}
              formatInCurrency={formatInCurrency}
              autoFocus
            />
          </View>
          {!isClaimRewardsPending && insufficientBalanceForFee && (
            <Text
              testID="insufficent_balance_error_msg"
              variant="caption"
              sx={{ color: '$textDanger', alignSelf: 'center', marginTop: 8 }}>
              {SendErrorMessage.INSUFFICIENT_BALANCE_FOR_FEE}
            </Text>
          )}
        </View>
        <GroupList
          itemHeight={60}
          data={feeData}
          textContainerSx={{
            marginTop: 0
          }}
        />
      </View>
    </ScrollScreen>
  )
}
