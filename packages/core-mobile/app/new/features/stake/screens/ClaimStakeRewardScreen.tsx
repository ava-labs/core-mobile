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
import { useAvaxPrice } from 'features/portfolio/hooks/useAvaxPrice'
import { CONFETTI_DURATION_MS } from 'common/consts'
import { selectIsInAppReviewBlocked } from 'store/posthog/slice'
import { promptForAppReviewAfterSuccessfulTransaction } from 'features/appReview/utils/promptForAppReviewAfterSuccessfulTransaction'
import { selectActiveWallet } from 'store/wallet/slice'
import { WalletType } from 'services/wallet/types'
import { showLedgerReviewTransaction } from 'features/ledger/utils'
import { Operation } from 'services/earn/computeDelegationSteps/types'

export const ClaimStakeRewardScreen = (): JSX.Element => {
  const isInAppReviewBlocked = useSelector(selectIsInAppReviewBlocked)
  const { navigate, back, dismissAll } = useRouter()
  const { formatTokenInCurrency } = useFormatCurrency()
  const pChainBalance = usePChainBalance()
  const ref = useRef<TokenUnitInputHandle>(null)
  const [claimableAmountInAvax, setClaimableAmountInAvax] =
    useState<TokenUnit>()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const pNetwork = NetworkService.getAvalancheNetworkP(isDeveloperMode)
  const avaxPrice = useAvaxPrice()
  const refreshStakingBalances = useRefreshStakingBalances()
  const activeWallet = useSelector(selectActiveWallet)

  const isLedgerWallet =
    activeWallet?.type === WalletType.LEDGER ||
    activeWallet?.type === WalletType.LEDGER_LIVE

  // Use ref to break circular dependency between onFundsStuck and claimRewards
  const claimRewardsRef = useRef<
    | ((
        onProgress?: (step: number, operation: Operation | null) => void
      ) => Promise<void>)
    | undefined
  >(undefined)

  const onClaimSuccess = useCallback((): void => {
    refreshStakingBalances({ shouldRefreshStakes: false })

    AnalyticsService.capture('StakeClaimSuccess')

    transactionSnackbar.success({ message: 'Stake reward claimed' })
    back()

    setTimeout(() => {
      confetti.restart()
    }, 100)

    if (!isInAppReviewBlocked) {
      // Run the app-review prompt flow after confetti finishes
      setTimeout(() => {
        promptForAppReviewAfterSuccessfulTransaction()
      }, CONFETTI_DURATION_MS + 200)
    }
  }, [refreshStakingBalances, back, isInAppReviewBlocked])

  const onClaimError = useCallback(
    (error: Error): void => {
      AnalyticsService.capture('StakeClaimFail')

      // Close any open modals (including Ledger progress modal)
      dismissAll()

      // Check for insufficient funds error
      const isInsufficientFunds =
        error.message.toLowerCase().includes('insufficient') ||
        error.message.toLowerCase().includes('not enough')

      if (isInsufficientFunds) {
        showAlert({
          title: 'Insufficient Funds',
          description:
            'You do not have enough AVAX to complete this claim. Please add more funds and try again.',
          buttons: [
            {
              text: 'OK',
              onPress: () => {
                back()
              }
            }
          ]
        })
      } else {
        showAlert({
          title: 'Claim Failed',
          description: error.message,
          buttons: [
            {
              text: 'OK',
              onPress: () => {
                back()
              }
            }
          ]
        })
      }
    },
    [dismissAll, back]
  )

  const onFundsStuck = useCallback((): void => {
    const performRetry = (
      onProgress?: (step: number, operation: Operation | null) => void
    ): void => {
      AnalyticsService.capture('StakeIssueClaim')
      claimRewardsRef.current?.(onProgress)
    }

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
          onPress: () => {
            // For Ledger wallets, re-establish connection before retrying
            if (isLedgerWallet) {
              showLedgerReviewTransaction({
                network: pNetwork,
                onApprove: async onProgress => {
                  performRetry(onProgress)
                },
                onReject: () => {
                  // User cancelled Ledger connection
                },
                stakingProgress: {
                  // Use 3 steps as worst case (may be 2 if no atomic memory funds)
                  totalSteps: 3,
                  // eslint-disable-next-line @typescript-eslint/no-empty-function
                  onComplete: () => {},
                  // eslint-disable-next-line @typescript-eslint/no-empty-function
                  onCancel: () => {}
                }
              })
            } else {
              performRetry()
            }
          }
        }
      ]
    })
  }, [back, isLedgerWallet, pNetwork])

  const {
    claimRewards,
    isPending: isClaimRewardsPending,
    totalFees,
    feeCalculationError
  } = useClaimRewards(onClaimSuccess, onClaimError, onFundsStuck)

  // Update ref when claimRewards changes
  useEffect(() => {
    claimRewardsRef.current = claimRewards
  }, [claimRewards])

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
    // @ts-ignore TODO: make routes typesafe
    navigate('/stake')
  }, [back, navigate])

  const issueClaimRewards = useCallback(() => {
    AnalyticsService.capture('StakeIssueClaim')

    if (isLedgerWallet) {
      showLedgerReviewTransaction({
        network: pNetwork,
        onApprove: async onProgress => {
          claimRewards(onProgress)
        },
        onReject: () => {
          // User cancelled Ledger connection
        },
        stakingProgress: {
          totalSteps: 2,
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          onComplete: () => {},
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          onCancel: () => {}
        }
      })
    } else {
      claimRewards()
    }
  }, [claimRewards, isLedgerWallet, pNetwork])

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

  // TESTING: Commented out to allow testing with 0.1 AVAX even when balance is 0
  // useEffect(() => {
  //   if (
  //     pChainBalance &&
  //     pChainBalance.balancePerType.unlockedUnstaked === undefined
  //   ) {
  //     showAlert({
  //       title: 'No claimable balance',
  //       description: 'You have no balance available for claiming.',
  //       buttons: [{ text: 'Go back', onPress: back }]
  //     })
  //   }
  // }, [pChainBalance, back])

  const renderFooter = useCallback(() => {
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
          onPress={issueClaimRewards}
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
    isClaimRewardsPending,
    handleCancel,
    issueClaimRewards,
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
