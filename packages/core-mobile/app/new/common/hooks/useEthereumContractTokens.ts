import { NetworkContractToken } from '@avalabs/vm-module-types'
import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useSelector } from 'react-redux'
import { selectAllCustomTokens } from 'store/customToken'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useMemo } from 'react'
import { getNetworkContractTokens } from 'hooks/networks/utils/getNetworkContractTokens'
import { useNetworks } from 'hooks/networks/useNetworks'
import { isEthereumNetwork } from 'services/network/utils/isEthereumNetwork'

export const useEthereumContractTokens = (): NetworkContractToken[] => {
  const { allNetworks } = useNetworks()

  const ethereumNetwork = useMemo(() => {
    return Object.values(allNetworks).find(network =>
      isEthereumNetwork(network)
    )
  }, [allNetworks])

  const allCustomTokens = useSelector(selectAllCustomTokens)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const { data } = useQuery({
    enabled: ethereumNetwork !== undefined,
    queryKey: [ReactQueryKeys.NETWORK_CONTRACT_TOKENS, ethereumNetwork],
    queryFn: () => getNetworkContractTokens(ethereumNetwork),
    staleTime: Infinity,
    networkMode: 'offlineFirst'
  })

  return useMemo(() => {
    const t = data ?? []

    // if network is testnet, merge with custom tokens if exists
    if (ethereumNetwork && ethereumNetwork.isTestnet === isDeveloperMode) {
      const customTokens = allCustomTokens[ethereumNetwork.chainId]
      if (customTokens && customTokens.length > 0) {
        return [...t, ...customTokens]
      }
    }
    return t
  }, [allCustomTokens, data, isDeveloperMode, ethereumNetwork])
}
