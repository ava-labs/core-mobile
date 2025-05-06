import { NetworkContractToken } from '@avalabs/vm-module-types'
import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useSelector } from 'react-redux'
import { selectAllCustomTokens } from 'store/customToken'
import { useMemo } from 'react'
import { getNetworkContractTokens } from 'hooks/networks/utils/getNetworkContractTokens'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'

export const useCChainContractTokens = (): NetworkContractToken[] => {
  const cChainNetwork = useCChainNetwork()

  const allCustomTokens = useSelector(selectAllCustomTokens)

  const { data } = useQuery({
    enabled: cChainNetwork !== undefined,
    queryKey: [ReactQueryKeys.NETWORK_CONTRACT_TOKENS, cChainNetwork],
    queryFn: () => getNetworkContractTokens(cChainNetwork),
    staleTime: Infinity,
    networkMode: 'offlineFirst'
  })

  return useMemo(() => {
    if (cChainNetwork === undefined) {
      return []
    }

    const t = data ?? []

    const customTokens = allCustomTokens[cChainNetwork.chainId]
    if (customTokens && customTokens.length > 0) {
      return [...t, ...customTokens]
    }

    return t
  }, [data, cChainNetwork, allCustomTokens])
}
