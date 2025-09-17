import { useSelector } from 'react-redux'
import EarnService from 'services/earn/EarnService'
import { selectIsDeveloperMode } from 'store/settings/advanced/slice'
import { selectActiveAccount } from 'store/account/slice'
import { selectCBaseFeeMultiplier } from 'store/posthog/slice'
import Logger from 'utils/Logger'
import { FundsStuckError } from 'hooks/earn/errors'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { SendErrorMessage } from 'errors/sendError'
import { useActiveWallet } from 'common/hooks/useActiveWallet'
import { useCallback } from 'react'
import { useUiSafeMutation } from 'hooks/useUiSafeMutation'
import { useClaimFees } from './useClaimFees'
import { useGetFeeState } from './useGetFeeState'

/**
 * a hook to claim rewards by doing a cross chain transfer from P to C chain
 *
 * notes:
 * - export P fee is dynamic and will be deducted automatically from P balance
 * - import C fee is dynamic and will be deducted automatically from the UTXOs present in the shared memory
 */
export const useClaimRewards = (
  onSuccess: () => void,
  onError: (error: Error) => void,
  onFundsStuck: (error: Error) => void
): {
  claimRewards: () => Promise<void>
  isPending: boolean
  totalFees?: TokenUnit
  feeCalculationError?: SendErrorMessage
} => {
  const activeAccount = useSelector(selectActiveAccount)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const { defaultFeeState } = useGetFeeState()
  const cBaseFeeMultiplier = useSelector(selectCBaseFeeMultiplier)
  const activeWallet = useActiveWallet()

  const {
    totalFees,
    pClaimableBalance,
    amountToTransfer,
    feeCalculationError
  } = useClaimFees()
  const mutationFn = useCallback(async () => {
    if (!activeAccount) {
      throw Error('No active account')
    }

    if (!pClaimableBalance) {
      throw Error('No claimable balance')
    }

    if (!totalFees || !amountToTransfer) {
      throw Error('Unable to calculate fees')
    }

    Logger.info(`transfering ${amountToTransfer.toDisplay()} from P to C`)

    return EarnService.claimRewards({
      walletId: activeWallet.id,
      walletType: activeWallet.type,
      pChainBalance: pClaimableBalance,
      requiredAmount: amountToTransfer,
      activeAccount,
      isDevMode: isDeveloperMode,
      feeState: defaultFeeState,
      cBaseFeeMultiplier
    })
  }, [
    activeAccount,
    activeWallet,
    amountToTransfer,
    cBaseFeeMultiplier,
    defaultFeeState,
    isDeveloperMode,
    pClaimableBalance,
    totalFees
  ])

  const handleError = useCallback(
    (error: unknown) => {
      Logger.error('claim failed', error)
      if (error instanceof FundsStuckError) {
        onFundsStuck(error)
      } else if (error instanceof Error) {
        onError(error)
      }
    },
    [onFundsStuck, onError]
  )

  const { safeMutate, isPending } = useUiSafeMutation({
    mutationFn,
    onSuccess,
    onError: handleError
  })

  return {
    claimRewards: safeMutate,
    isPending,
    totalFees,
    feeCalculationError
  }
}
