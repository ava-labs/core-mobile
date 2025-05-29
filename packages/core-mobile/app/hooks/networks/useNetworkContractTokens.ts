import { Network } from '@avalabs/core-chains-sdk'
import { NetworkContractToken } from '@avalabs/vm-module-types'
import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useSelector } from 'react-redux'
import { selectAllCustomTokens } from 'store/customToken'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useMemo } from 'react'
import { getNetworkContractTokens } from './utils/getNetworkContractTokens'

export const useNetworkContractTokens = (
  network: Network | undefined
): NetworkContractToken[] => {
  const allCustomTokens = useSelector(selectAllCustomTokens)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const { data } = useQuery({
    queryKey: [ReactQueryKeys.NETWORK_CONTRACT_TOKENS, network],
    queryFn: () => getNetworkContractTokens(network),
    staleTime: 120000, // 2 mins,
    networkMode: 'offlineFirst'
  })

  return useMemo(() => {
    const t = data ?? []

    // if network is testnet, merge with custom tokens if exists
    if (network && network.isTestnet === isDeveloperMode) {
      const customTokens = allCustomTokens[network.chainId]
      if (customTokens && customTokens.length > 0) {
        return [...t, ...customTokens]
      }
    }
    return t
  }, [allCustomTokens, data, isDeveloperMode, network])
}
