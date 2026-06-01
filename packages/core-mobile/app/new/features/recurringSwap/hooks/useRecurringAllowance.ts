import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import {
  readErc20Allowance,
  fetchRouterAddress
} from '../services/AllowanceService'

type Params = {
  ownerAddress: string | undefined
  chainId: number | undefined
  tokenIn: string | undefined
  totalAmountIn: bigint | undefined
}

export type AllowanceResult = {
  router: string
  allowance: bigint
  needsApproval: boolean
  requiredAmount: bigint
}

export function useRecurringAllowance(params: Params) {
  const enabled =
    params.ownerAddress !== undefined &&
    params.ownerAddress !== '' &&
    params.chainId !== undefined &&
    params.tokenIn !== undefined &&
    params.tokenIn !== '' &&
    params.totalAmountIn !== undefined

  return useQuery({
    enabled,
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- params.totalAmountIn is included as a string (bigint is not JSON-serialisable); the raw field would be redundant
    queryKey: [
      ReactQueryKeys.RECURRING_ALLOWANCE,
      params.ownerAddress,
      params.chainId,
      params.tokenIn,
      params.totalAmountIn?.toString()
    ],
    staleTime: 30_000,
    queryFn: async (): Promise<AllowanceResult> => {
      const router = await fetchRouterAddress(params.chainId!)
      const allowance = await readErc20Allowance({
        chainId: params.chainId!,
        token: params.tokenIn!,
        owner: params.ownerAddress!,
        spender: router
      })
      const requiredAmount = params.totalAmountIn!
      return {
        router,
        allowance,
        requiredAmount,
        needsApproval: allowance < requiredAmount
      }
    }
  })
}
