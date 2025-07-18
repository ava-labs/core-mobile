import { NetworkContractToken } from '@avalabs/vm-module-types'
import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useMemo } from 'react'
import { getNetworkContractTokens } from 'hooks/networks/utils/getNetworkContractTokens'
import useSolanaNetwork from 'hooks/earn/useSolanaNetwork'

export const useSolanaTokens = (): NetworkContractToken[] => {
  const solanaNetwork = useSolanaNetwork()

  const { data } = useQuery({
    enabled: solanaNetwork !== undefined,
    queryKey: [ReactQueryKeys.NETWORK_CONTRACT_TOKENS, solanaNetwork],
    queryFn: () => getNetworkContractTokens(solanaNetwork),
    staleTime: 120000, // 2 mins,
    networkMode: 'offlineFirst'
  })

  return useMemo(() => {
    if (solanaNetwork === undefined) {
      return []
    }

    return data ?? []
  }, [data, solanaNetwork])
}
