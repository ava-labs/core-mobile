import { isPerpsUserRejection } from '@avalabs/perps-sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { showSnackbar } from 'common/utils/toast'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { useCallback } from 'react'
import { usePerps } from '../contexts/PerpsProvider'
import { createUserSigner } from '../services/perpsSigner'
import { logHyperliquidError } from '../utils/orderExecution'
import { useUserAbstraction } from './useUserAbstraction'

export type UsePerpsUnifiedAccountResult = {
  /** `true` once HL reports `unifiedAccount` for the connected wallet. */
  readonly isUnifiedAccount: boolean
  /** `true` while the abstraction mode query is in flight. */
  readonly isLoading: boolean
  /** `true` while the user-signed enable action is being submitted. */
  readonly isEnabling: boolean
  /**
   * Prompt the master wallet to switch the account to unified mode. Throws on
   * signer / API failure.
   */
  readonly enableUnifiedAccount: () => Promise<void>
}

/**
 * Tracks whether the connected wallet uses Hyperliquid unified account mode and
 * exposes a one-time master-wallet action to opt in. Mirrors core-web's
 * `usePerpsUnifiedAccount`.
 */
export function usePerpsUnifiedAccount(): UsePerpsUnifiedAccountResult {
  const { manager, userAddress, refreshClearinghouse } = usePerps()
  const { request } = useInAppRequest()
  const queryClient = useQueryClient()
  const abstractionMode = useUserAbstraction()
  const isUnifiedAccount = abstractionMode === 'unifiedAccount'
  const isLoading = userAddress !== undefined && abstractionMode === undefined

  const enableMutation = useMutation({
    mutationFn: async () => {
      if (manager === null) {
        throw new Error('Perps not ready')
      }
      if (userAddress === undefined) {
        throw new Error('Connect wallet to enable unified account')
      }
      await manager.setUserAbstraction({
        userSigner: createUserSigner(userAddress, request),
        user: userAddress,
        abstraction: 'unifiedAccount'
      })
    },
    onSuccess: async () => {
      // Unified mode changes how HL reports balances (perp + spot pool).
      refreshClearinghouse()
      await queryClient.invalidateQueries({
        queryKey: [ReactQueryKeys.PERPS_USER_ABSTRACTION]
      })
    }
  })

  const { mutateAsync: enableMutateAsync, isPending: isEnabling } =
    enableMutation
  const enableUnifiedAccount = useCallback(async () => {
    try {
      await enableMutateAsync()
    } catch (e) {
      logHyperliquidError('[usePerpsUnifiedAccount] enable failed', e)
      if (isPerpsUserRejection(e)) {
        showSnackbar('User rejected the request.')
      } else {
        const message = e instanceof Error ? e.message : String(e)
        showSnackbar(`Could not enable unified account. ${message}`)
      }
      throw e
    }
  }, [enableMutateAsync])

  return {
    isUnifiedAccount,
    isLoading,
    isEnabling,
    enableUnifiedAccount
  }
}
