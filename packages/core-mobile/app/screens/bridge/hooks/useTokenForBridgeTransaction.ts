import { Blockchain, BridgeTransaction } from '@avalabs/bridge-sdk'
import { BridgeTransfer } from '@avalabs/bridge-unified'
import {
  BITCOIN_NETWORK,
  ChainId,
  NetworkContractToken,
  NetworkToken
} from '@avalabs/chains-sdk'
import { useNetworks } from 'hooks/useNetworks'
import { useMemo } from 'react'

export function useTokenForBridgeTransaction(
  bridgeTransaction: BridgeTransaction | BridgeTransfer | undefined,
  isTestnet: boolean
): NetworkContractToken | NetworkToken | undefined {
  const { selectNetworkContractTokens } = useNetworks()
  const chainId = useMemo(() => {
    switch (bridgeTransaction?.sourceChain) {
      case Blockchain.BITCOIN:
        return isTestnet ? ChainId.BITCOIN_TESTNET : ChainId.BITCOIN
      case Blockchain.ETHEREUM:
        // ETHEREUM_SEPOLIA doesn't have contract tokens, so always use ETHEREUM_HOMESTEAD chainid.
        return ChainId.ETHEREUM_HOMESTEAD
      case Blockchain.AVALANCHE:
      default:
        return isTestnet
          ? ChainId.AVALANCHE_TESTNET_ID
          : ChainId.AVALANCHE_MAINNET_ID
    }
  }, [bridgeTransaction, isTestnet])

  const tokens = selectNetworkContractTokens(chainId)

  return useMemo(() => {
    const token = tokens.find(t => t.symbol === bridgeTransaction?.symbol)

    if (token) return token

    if (bridgeTransaction?.symbol === BITCOIN_NETWORK.networkToken.symbol) {
      return BITCOIN_NETWORK.networkToken
    }

    return undefined
  }, [tokens, bridgeTransaction])
}
