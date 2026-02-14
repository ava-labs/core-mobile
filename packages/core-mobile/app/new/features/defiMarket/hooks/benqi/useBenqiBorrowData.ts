import { skipToken, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Address, createPublicClient, http } from 'viem'
import { selectActiveAccount } from 'store/account'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { getViemChain } from 'utils/getViemChain/getViemChain'
import { BenqiBorrowData } from '../../types'
import { fetchBenqiUserBorrowData } from '../../utils/borrow'

export const useBenqiBorrowData = (
  qTokenAddress?: Address
): {
  data: BenqiBorrowData | undefined
  isLoading: boolean
  isFetching: boolean
  error: Error | null
} => {
  const activeAccount = useSelector(selectActiveAccount)
  const userAddress = activeAccount?.addressC as Address | undefined
  const cChainNetwork = useCChainNetwork()

  const networkClient = useMemo(() => {
    if (!cChainNetwork) {
      return undefined
    }
    const cChain = getViemChain(cChainNetwork)
    return createPublicClient({ chain: cChain, transport: http() })
  }, [cChainNetwork])

  const shouldFetch = !!networkClient && !!userAddress

  const { data, isLoading, isFetching, error } = useQuery({
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
    error
  }
}
