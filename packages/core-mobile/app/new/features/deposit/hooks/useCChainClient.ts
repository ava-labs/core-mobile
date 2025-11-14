import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { useMemo } from 'react'
import { getViemChain } from 'utils/getViemChain/getViemChain'
import { createPublicClient, http, PublicClient } from 'viem'

export const useCChainClient = (): PublicClient | undefined => {
  const cChainNetwork = useCChainNetwork()
  return useMemo(() => {
    if (!cChainNetwork) {
      return undefined
    }

    const cChain = getViemChain(cChainNetwork)

    return createPublicClient({ chain: cChain, transport: http() })
  }, [cChainNetwork])
}
