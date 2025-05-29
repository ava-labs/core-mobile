import { NetworkContractToken } from '@avalabs/vm-module-types'
import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useSelector } from 'react-redux'
import { selectAllCustomTokens } from 'store/customToken'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useMemo } from 'react'
import { getNetworkContractTokens } from 'hooks/networks/utils/getNetworkContractTokens'
import { useNetworks } from 'hooks/networks/useNetworks'
import { getEthereumNetwork } from 'services/network/utils/providerUtils'

export const useEthereumContractTokens = (): NetworkContractToken[] => {
  const { allNetworks } = useNetworks()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const ethereumNetwork = getEthereumNetwork(allNetworks, isDeveloperMode)

  const allCustomTokens = useSelector(selectAllCustomTokens)

  const { data } = useQuery({
    enabled: ethereumNetwork !== undefined,
    queryKey: [ReactQueryKeys.NETWORK_CONTRACT_TOKENS, ethereumNetwork],
    queryFn: () => getNetworkContractTokens(ethereumNetwork),
    staleTime: 120000, // 2 mins,
    networkMode: 'offlineFirst'
  })

  return useMemo(() => {
    if (ethereumNetwork === undefined) {
      return []
    }

    const t = data ?? []

    const customTokens = allCustomTokens[ethereumNetwork.chainId]
    if (customTokens && customTokens.length > 0) {
      return [...t, ...customTokens]
    }

    return t
  }, [allCustomTokens, data, ethereumNetwork])
}
