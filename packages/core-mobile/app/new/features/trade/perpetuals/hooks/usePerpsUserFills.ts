import {
  sortUserFillsNewestFirst,
  type Address,
  type UserFill
} from '@avalabs/perps-sdk'
import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { getPerpsInfoClient } from '../services/perpsClients'

/**
 * The active account's recent Hyperliquid fills (trade history), newest first.
 *
 * Read-only: pulled from the shared `/info` REST client keyed by the active
 * account's C-Chain address — no signer / manager required.
 */
export const usePerpsUserFills = (): {
  fills: readonly UserFill[]
  isLoading: boolean
  /** Re-runs the fills query; resolves when the refetch settles. */
  refetch: () => Promise<unknown>
} => {
  const activeAccount = useSelector(selectActiveAccount)
  const userAddress = activeAccount?.addressC as Address | undefined

  const { data, isPending, refetch } = useQuery({
    enabled: userAddress !== undefined,
    queryKey: [ReactQueryKeys.PERPS_USER_FILLS, userAddress],
    queryFn: () => {
      if (userAddress === undefined) {
        return []
      }
      return getPerpsInfoClient().getUserFills(userAddress)
    },
    staleTime: 10 * 1000
  })

  const fills = useMemo(
    () => (data ? sortUserFillsNewestFirst(data) : []),
    [data]
  )

  return {
    fills,
    isLoading: isPending,
    refetch
  }
}
