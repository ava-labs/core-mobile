import {
  UseMutationResult,
  useMutation,
  useQueryClient,
  QueryClient
} from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import EarnService from 'services/earn/EarnService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectActiveAccount } from 'store/account'
import { selectSelectedCurrency } from 'store/settings/currency'
import { Avax } from 'types/Avax'
import Logger from 'utils/Logger'
import { FundsStuckError } from 'hooks/earn/errors'
import { usePChainBalance } from './usePChainBalance'
import { useClaimFees } from './useClaimFees'

/**
 * a hook to claim rewards by doing a cross chain transfer from P to C chain
 *
 * notes:
 * - export P fee is constant and will be deducted automatically from P balance
 * - import C fee is dynamic and will be deducted automatically from the UTXOs present in the shared memory
 */
export const useClaimRewards = (
  onSuccess: () => void,
  onError: (error: Error) => void,
  onFundsStuck: (error: Error) => void
): UseMutationResult<void, Error, void, unknown> => {
  const queryClient = useQueryClient()
  const activeAccount = useSelector(selectActiveAccount)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const pChainBalance = usePChainBalance()
  const { totalFees, exportPFee } = useClaimFees()
  const pAddress = activeAccount?.addressPVM ?? ''
  const cAddress = activeAccount?.addressC ?? ''

  return useMutation({
    mutationFn: () => {
      if (!activeAccount) {
        throw Error('no active account')
      }

      if (!totalFees) {
        throw Error('unable to calculate fees')
      }

      const totalClaimable = Avax.fromNanoAvax(
        pChainBalance?.data?.unlockedUnstaked[0]?.amount ?? 0
      )

      if (totalFees.gt(totalClaimable)) {
        throw Error('not enough balance to cover fee')
      }

      // maximum amount that we can transfer = max claimable amount - export P fee
      const amountToTransfer = totalClaimable.sub(exportPFee)

      Logger.info(`transfering ${amountToTransfer.toDisplay()} from P to C`)

      return EarnService.claimRewards(
        totalClaimable,
        amountToTransfer,
        activeAccount,
        isDeveloperMode
      )
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
