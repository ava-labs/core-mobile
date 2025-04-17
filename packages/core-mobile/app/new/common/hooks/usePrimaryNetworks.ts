import { useNetworks } from 'hooks/networks/useNetworks'
import { NetworkWithCaip2ChainId } from 'store/network'

import {
  AVALANCHE_XP_NETWORK,
  AVALANCHE_XP_TEST_NETWORK,
  BITCOIN_NETWORK,
  BITCOIN_TEST_NETWORK,
  ChainId
} from '@avalabs/core-chains-sdk'
import { useMemo } from 'react'

export function usePrimaryNetworks(): {
  networks: NetworkWithCaip2ChainId[]
  testNetworks: NetworkWithCaip2ChainId[]
  mainNetworks: NetworkWithCaip2ChainId[]
} {
  const { allNetworks } = useNetworks()

  const mainNetworks = useMemo(() => {
    return [
      {
        ...allNetworks[ChainId.AVALANCHE_MAINNET_ID],
        chainName: 'Avalanche C-Chain/EVM'
      },
      { ...AVALANCHE_XP_NETWORK, chainName: 'Avalanche X/P-Chain' },
      BITCOIN_NETWORK
    ] as NetworkWithCaip2ChainId[]
  }, [allNetworks])

  const testNetworks = useMemo(() => {
    return [
      {
        ...allNetworks[ChainId.AVALANCHE_TESTNET_ID],
        chainName: 'Avalanche C-Chain/EVM Testnet'
      },
      {
        ...AVALANCHE_XP_TEST_NETWORK,
        chainName: 'Avalanche X/P-Chain Testnet'
      },
      BITCOIN_TEST_NETWORK
    ] as NetworkWithCaip2ChainId[]
  }, [allNetworks])

  const networks = useMemo(
    () => [...mainNetworks, ...testNetworks],
    [testNetworks, mainNetworks]
  )

  return { networks, testNetworks, mainNetworks }
}
