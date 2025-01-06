import {
  useMutation,
  useQueryClient,
  QueryClient,
  UseMutationResult
} from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced/slice'
import { selectActiveAccount } from 'store/account/slice'
import { selectSelectedCurrency } from 'store/settings/currency/slice'
import Logger from 'utils/Logger'
import { FundsStuckError } from 'hooks/earn/errors'
import { useDelegationContext } from 'contexts/DelegationContext'

export const useIssueDelegation = (
  onSuccess: (txId: string) => void,
  onError: (error: Error) => void,
  onFundsStuck: (error: Error) => void
): {
  issueDelegationMutation: UseMutationResult<
    string,
    Error,
    {
      nodeId: string
      startDate: Date
      endDate: Date
      recomputeSteps?: boolean
    },
    unknown
  >
} => {
  const { delegate, compute, steps, stakeAmount } = useDelegationContext()
  const queryClient = useQueryClient()
  const activeAccount = useSelector(selectActiveAccount)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const selectedCurrency = useSelector(selectSelectedCurrency)

  const pAddress = activeAccount?.addressPVM ?? ''
  const cAddress = activeAccount?.addressC ?? ''

  const issueDelegationMutation = useMutation({
    mutationFn: async ({
      nodeId,
      startDate,
      endDate,
      recomputeSteps = false
    }: {
      nodeId: string
      startDate: Date
      endDate: Date
      recomputeSteps?: boolean
    }) => {
      if (recomputeSteps) {
        const newSteps = await compute(stakeAmount.toSubUnit())
        return delegate({
          steps: newSteps,
          startDate,
          endDate,
          nodeId
        })
      }

      return delegate({
        steps,
        startDate,
        endDate,
        nodeId
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
      if (error instanceof FundsStuckError) {
        onFundsStuck(error)
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
}): void => {
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
