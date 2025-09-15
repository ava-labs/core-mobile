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
import { useEffect, useState } from 'react'

/**
 * Custom hook to issue a staking delegation transaction.
 *
 * This wraps a React Query mutation and triggers UI callbacks (onSuccess/onError)
 * via state + useEffect rather than directly in the mutation callbacks.
 *
 * Why?
 *  - React Query's `onSuccess`/`onError` are invoked in the same render frame as the mutation resolution.
 *    Triggering heavy UI actions (navigation, dismissing modals, snackbars) in that timing
 *    caused race conditions with native-stack transitions and layout.
 *  - By setting a state value (`delegationTxHash` or `delegationError`) and handling it in `useEffect`,
 *    we ensure the UI callbacks are fired on the next render frame, making transitions more stable.
 */
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

  // Store mutation results/errors temporarily to trigger callbacks
  const [delegationTxHash, setDelegationTxHash] = useState<string>()
  const [delegationError, setDelegationError] = useState<Error>()

  // When tx hash is set, trigger success callback in next render frame
  useEffect(() => {
    if (!delegationTxHash) return

    onSuccess(delegationTxHash)
    setDelegationTxHash(undefined)
  }, [delegationTxHash, onSuccess])

  // When error is set, trigger appropriate error callback in next render frame
  useEffect(() => {
    if (!delegationError) return

    if (delegationError instanceof FundsStuckError) {
      onFundsStuck(delegationError)
    } else {
      onError(delegationError)
    }

    setDelegationError(undefined)
  }, [delegationError, onFundsStuck, onError])

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
      setDelegationTxHash(txId)
    },
    onError: error => {
      Logger.error('delegation failed', error)
      setDelegationError(error)
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
