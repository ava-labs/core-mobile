import { useQuery } from '@tanstack/react-query'
import Config from 'react-native-config'
import { ReactQueryKeys } from 'consts/reactQueryKeys'

export type InfoChainSupportedToken = {
  address: string
  minimumAmount: string
}

export type InfoChainRecurring = {
  enabled: boolean
  minFrequencySeconds?: number
  supportedTokens?: InfoChainSupportedToken[]
}

export type InfoChain = {
  chainId: number
  recurring?: InfoChainRecurring
}

const BASE_URL = `${Config.PROXY_URL ?? ''}/proxy/markr`
const BEARER_TOKEN = Config.MARKR_API_KEY ?? ''

async function fetchInfoChains(): Promise<InfoChain[]> {
  const res = await fetch(`${BASE_URL}/info/chains`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${BEARER_TOKEN}`
    }
  })

  if (!res.ok) {
    throw new Error(`info/chains request failed with status ${res.status}`)
  }

  return (await res.json()) as InfoChain[]
}

export function useInfoChains() {
  return useQuery({
    queryKey: [ReactQueryKeys.RECURRING_INFO_CHAINS],
    queryFn: fetchInfoChains,
    staleTime: 5 * 60 * 1000, // 5 minutes — long enough to dedupe within a session
    refetchOnWindowFocus: true // catch backend config updates on app foreground
  })
}
