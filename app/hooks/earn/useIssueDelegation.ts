import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import EarnService from 'services/earn/EarnService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectActiveAccount } from 'store/account'
import { selectSelectedCurrency } from 'store/settings/currency'
import { QueryClient } from '@tanstack/query-core'
import { Avax } from 'types/Avax'
import { calculateAmountForCrossChainTransfer } from 'hooks/earn/useGetAmountForCrossChainTransfer'
import Logger from 'utils/Logger'
import { useCChainBalance } from './useCChainBalance'

export const useIssueDelegation = (
  onSuccess: () => void,
  onError: (error: Error) => void
) => {
  const queryClient = useQueryClient()
  const activeAccount = useSelector(selectActiveAccount)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { data: cChainBalanceRes } = useCChainBalance()
  const cChainBalance = Avax.fromWei(cChainBalanceRes?.balance ?? 0)

  const pAddress = activeAccount?.addressPVM ?? ''
  const cAddress = activeAccount?.address ?? ''

  const issueDelegationMutation = useMutation({
    mutationFn: (data: {
      nodeId: string
      stakingAmount: Avax
      startDate: Date
      endDate: Date
      claimableBalance: Avax
    }) => {
      if (!activeAccount) {
        return Promise.reject('no active account')
      }

      const cChainRequiredAmount = calculateAmountForCrossChainTransfer(
        data.stakingAmount,
        data.claimableBalance
      )

      return EarnService.collectTokensForStaking({
        activeAccount,
        cChainBalance: cChainBalance,
        isDevMode: isDeveloperMode,
        requiredAmount: cChainRequiredAmount
      }).then(successfullyCollected => {
        if (successfullyCollected) {
          return EarnService.issueAddDelegatorTransaction({
            activeAccount,
            endDate: data.endDate,
            isDevMode: isDeveloperMode,
            nodeId: data.nodeId,
            stakeAmount: data.stakingAmount.toSubUnit(),
            startDate: data.startDate
          })
        } else {
          throw Error('Something went wrong')
        }
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
      Logger.error('delegation failed', error)
      onError(error)
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
