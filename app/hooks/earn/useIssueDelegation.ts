import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import EarnService from 'services/earn/EarnService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectActiveAccount } from 'store/account'
import { selectSelectedCurrency } from 'store/settings/currency'
import { QueryClient } from '@tanstack/query-core'
import { Avax } from 'types/Avax'
import { calculateAmountForCrossChainTransfer } from 'hooks/earn/useGetAmountForCrossChainTransfer'
import Logger from 'utils/Logger'
import { EarnError } from 'hooks/earn/errors'
import GlacierBalanceService from 'services/balance/GlacierBalanceService'
import { setAtomicImportFailed } from 'store/earn'
import { useCChainBalance } from './useCChainBalance'

export const useIssueDelegation = (
  onSuccess: (txId: string) => void,
  onError: (error: Error) => void,
  onFundsStuck: (error: Error) => void
) => {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const activeAccount = useSelector(selectActiveAccount)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { data: cChainBalanceRes } = useCChainBalance()
  const cChainBalance = Avax.fromWei(cChainBalanceRes?.balance ?? 0)

  const pAddress = activeAccount?.addressPVM ?? ''
  const cAddress = activeAccount?.address ?? ''

  const issueDelegationMutation = useMutation({
    mutationFn: async (data: {
      nodeId: string
      stakingAmount: Avax
      startDate: Date
      endDate: Date
    }) => {
      if (!activeAccount) {
        return Promise.reject('no active account')
      }

      Logger.trace('importAnyStuckFunds...')
      await EarnService.importAnyStuckFunds({
        activeAccount,
        isDevMode: isDeveloperMode
      })
      Logger.trace('getPChainBalance...')
      const addressPVM = activeAccount.addressPVM
      const pChainBalance = await GlacierBalanceService.getPChainBalance(
        isDeveloperMode,
        addressPVM ? [addressPVM] : []
      )
      const pChainBalanceNAvax = pChainBalance.unlockedUnstaked[0]?.amount
      const claimableBalance = Avax.fromNanoAvax(pChainBalanceNAvax ?? 0)
      Logger.trace('getPChainBalance: ', claimableBalance.toDisplay())
      const cChainRequiredAmount = calculateAmountForCrossChainTransfer(
        data.stakingAmount,
        claimableBalance
      )
      Logger.trace('cChainRequiredAmount: ', cChainRequiredAmount.toDisplay())
      Logger.trace('collectTokensForStaking...')
      await EarnService.collectTokensForStaking({
        activeAccount,
        cChainBalance: cChainBalance,
        isDevMode: isDeveloperMode,
        requiredAmount: cChainRequiredAmount
      })
      return EarnService.issueAddDelegatorTransaction({
        activeAccount,
        endDate: data.endDate,
        isDevMode: isDeveloperMode,
        nodeId: data.nodeId,
        stakeAmount: data.stakingAmount.toSubUnit(),
        startDate: data.startDate
      })
    },
    onSuccess: txId => {
      refetchQueries({
        isDeveloperMode,
        queryClient,
        pAddress,
        cAddress,
        selectedCurrency
      })
      // handle UI success state
      onSuccess(txId)
    },
    onError: error => {
      Logger.error('delegation failed', error)
      if (error instanceof EarnError) {
        switch (error.name) {
          case 'CONFIRM_EXPORT_FAIL':
          case 'ISSUE_IMPORT_FAIL':
          case 'CONFIRM_IMPORT_FAIL':
            dispatch(setAtomicImportFailed(true))
            onFundsStuck(error)
            break
        }
      } else {
        onError(error)
      }
    }
  })

  return {
    issueDelegationMutation
  }
}

/**
 * refetch stakes as well as c + p balances with 2 second delay
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
}) => {
  setTimeout(() => {
    queryClient.invalidateQueries({
      queryKey: ['stakes', isDeveloperMode, pAddress]
    })
    queryClient.invalidateQueries({
      queryKey: ['pChainBalance', isDeveloperMode, pAddress]
    })
    queryClient.invalidateQueries({
      queryKey: ['cChainBalance', isDeveloperMode, cAddress, selectedCurrency]
    })
  }, 2000)
}
