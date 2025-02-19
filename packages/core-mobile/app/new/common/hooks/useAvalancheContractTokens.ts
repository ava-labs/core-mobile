import { NetworkContractToken } from '@avalabs/vm-module-types'
import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useSelector } from 'react-redux'
import { selectAllCustomTokens } from 'store/customToken'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useMemo } from 'react'
import { getNetworkContractTokens } from 'hooks/networks/utils/getNetworkContractTokens'
import { useNetworks } from 'hooks/networks/useNetworks'
import { isAvalancheNetwork } from 'services/network/utils/isAvalancheNetwork'

export const useAvalancheContractTokens = (): NetworkContractToken[] => {
  const { allNetworks } = useNetworks()

  const avalancheNetwork = useMemo(() => {
    return Object.values(allNetworks).find(network =>
      isAvalancheNetwork(network)
    )
  }, [allNetworks])

  const allCustomTokens = useSelector(selectAllCustomTokens)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const { data } = useQuery({
    enabled: avalancheNetwork !== undefined,
    queryKey: [ReactQueryKeys.NETWORK_CONTRACT_TOKENS, avalancheNetwork],
    queryFn: () => getNetworkContractTokens(avalancheNetwork),
    staleTime: Infinity,
    networkMode: 'offlineFirst'
  })

  return useMemo(() => {
    const t = data ?? []

    // if network is testnet, merge with custom tokens if exists
    if (avalancheNetwork && avalancheNetwork.isTestnet === isDeveloperMode) {
      const customTokens = allCustomTokens[avalancheNetwork.chainId]
      if (customTokens && customTokens.length > 0) {
        return [...t, ...customTokens]
      }
    }
    return t
  }, [data, avalancheNetwork, isDeveloperMode, allCustomTokens])
}
