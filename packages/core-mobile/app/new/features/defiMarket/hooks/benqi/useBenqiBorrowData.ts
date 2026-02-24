import { skipToken, useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Address } from 'viem'
import { selectActiveAccount } from 'store/account'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { BenqiBorrowData } from '../../types'
import { fetchBenqiUserBorrowData } from '../../utils/borrow'
import { useNetworkClient } from '../useNetworkClient'

export const useBenqiBorrowData = (
  qTokenAddress?: Address,
  options: { enabled?: boolean } = {}
): {
  data: BenqiBorrowData | undefined
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  refetch: () => Promise<unknown>
} => {
  const { enabled = true } = options
  const activeAccount = useSelector(selectActiveAccount)
  const userAddress = activeAccount?.addressC as Address | undefined
  const cChainNetwork = useCChainNetwork()
  const networkClient = useNetworkClient(cChainNetwork)

  const shouldFetch = enabled && !!networkClient && !!userAddress

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [
      ReactQueryKeys.BENQI_USER_BORROW_DATA,
      qTokenAddress,
      userAddress,
      networkClient?.chain.id
    ],
    queryFn: shouldFetch
      ? async () =>
          fetchBenqiUserBorrowData(networkClient, userAddress, qTokenAddress)
      : skipToken,
    staleTime: 30 * 1000 // 30 seconds
  })

  return {
    data,
    isLoading,
    isFetching,
    error,
    refetch
  }
}
