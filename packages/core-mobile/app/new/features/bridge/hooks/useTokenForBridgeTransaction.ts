import { BridgeTransfer } from '@avalabs/bridge-unified'
import { BITCOIN_NETWORK, NetworkToken } from '@avalabs/core-chains-sdk'
import { NetworkContractToken } from '@avalabs/vm-module-types'
import { useNetworkContractTokens } from 'hooks/networks/useNetworkContractTokens'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useMemo } from 'react'
import { BridgeTransaction } from '@avalabs/core-bridge-sdk'
import { getSourceChainId, isUnifiedBridgeTransfer } from '../utils/bridgeUtils'

export function useTokenForBridgeTransaction(
  bridgeTransaction: BridgeTransaction | BridgeTransfer | undefined,
  isTestnet: boolean
): NetworkContractToken | NetworkToken | undefined {
  const chainId = useMemo(() => {
    return getSourceChainId(bridgeTransaction, isTestnet)
  }, [bridgeTransaction, isTestnet])

  const { getNetwork } = useNetworks()
  const network = getNetwork(chainId)
  const tokens = useNetworkContractTokens(network)
  const symbol = isUnifiedBridgeTransfer(bridgeTransaction)
    ? bridgeTransaction?.asset.symbol
    : bridgeTransaction?.symbol

  return useMemo(() => {
    const token = tokens.find(t => t.symbol === symbol)

    if (token) return token

    if (symbol === BITCOIN_NETWORK.networkToken.symbol) {
      return BITCOIN_NETWORK.networkToken
    }

    return network?.networkToken
  }, [tokens, symbol, network])
}
