import { createPublicClient, http, PublicClient } from 'viem'
import { useMemo } from 'react'
import { Network } from '@avalabs/core-chains-sdk'
import { getViemChain } from 'utils/getViemChain/getViemChain'

export const useNetworkClient = (
  network: Network | undefined
): PublicClient | undefined => {
  return useMemo(() => {
    if (!network) {
      return undefined
    }

    const chain = getViemChain(network)
    return createPublicClient({ chain, transport: http() })
  }, [network])
}
