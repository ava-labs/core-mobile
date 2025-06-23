import {
  UseMutationResult,
  useMutation,
  useQueryClient,
  QueryClient
} from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import EarnService from 'services/earn/EarnService'
import { selectIsDeveloperMode } from 'store/settings/advanced/slice'
import { selectActiveAccount } from 'store/account/slice'
import { selectCBaseFeeMultiplier } from 'store/posthog/slice'
import { selectSelectedCurrency } from 'store/settings/currency/slice'
import Logger from 'utils/Logger'
import { FundsStuckError } from 'hooks/earn/errors'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { SendErrorMessage } from 'errors/sendError'
import { useActiveWallet } from 'common/hooks/useActiveWallet'
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
  mutation: UseMutationResult<void, Error, void, unknown>
  totalFees?: TokenUnit
  feeCalculationError?: SendErrorMessage
} => {
  const queryClient = useQueryClient()
  const activeAccount = useSelector(selectActiveAccount)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { defaultFeeState } = useGetFeeState()
  const cBaseFeeMultiplier = useSelector(selectCBaseFeeMultiplier)
  const activeWallet = useActiveWallet()

  const {
    totalFees,
    pClaimableBalance,
    amountToTransfer,
    feeCalculationError
  } = useClaimFees()

  const pAddress = activeAccount?.addressPVM ?? ''
  const cAddress = activeAccount?.addressC ?? ''

  const mutation = useMutation({
    mutationFn: () => {
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
    },
    onSuccess: () => {
      refetchQueries({
        isDeveloperMode,
        queryClient,
        pAddress,
        cAddress,
        selectedCurrency
      })
      // handle UI success state
      onSuccess()
    },
    onError: error => {
      Logger.error('claim failed', error)
      if (error instanceof FundsStuckError) {
        onFundsStuck(error)
      } else {
        onError(error)
      }
    }
  })
  return {
    mutation,
    totalFees,
    feeCalculationError
  }
}

/**
 * refetch c + p balances with 2 second delay
 * since glacier will have some delay
 * @param queryClient
 * @param isDeveloperMode
 * @param pAddress
 * @param cAddress
 * @param selectedCurrency
 */

export const refetchQueries = ({
  queryClient,
  isDeveloperMode,
  pAddress,
  cAddress,
  selectedCurrency
}: {
  queryClient: QueryClient
  isDeveloperMode: boolean
  pAddress: string
  cAddress: string
  selectedCurrency: string
}): void => {
  setTimeout(() => {
    queryClient.invalidateQueries({
      queryKey: ['pChainBalance', isDeveloperMode, pAddress]
    })
    queryClient.invalidateQueries({
      queryKey: ['cChainBalance', isDeveloperMode, cAddress, selectedCurrency]
    })
  }, 2000)
}
