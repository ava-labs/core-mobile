import { BridgeTransfer } from '@avalabs/bridge-unified'
import {
  BITCOIN_NETWORK,
  ChainId,
  NetworkToken
} from '@avalabs/core-chains-sdk'
import { NetworkContractToken } from '@avalabs/vm-module-types'
import { useNetworkContractTokens } from 'hooks/networks/useNetworkContractTokens'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useMemo } from 'react'
import { isBitcoinChainId } from 'utils/network/isBitcoinNetwork'
import { getChainIdFromCaip2 } from 'temp/caip2ChainIds'
import { isEthereumChainId } from 'services/network/utils/isEthereumNetwork'

export function useTokenForBridgeTransaction(
  bridgeTransaction: BridgeTransfer | undefined,
  isTestnet: boolean
): NetworkContractToken | NetworkToken | undefined {
  const chainId = useMemo(() => {
    const sourceChainId = bridgeTransaction?.sourceChain.chainId
      ? getChainIdFromCaip2(bridgeTransaction.sourceChain.chainId)
      : undefined

    if (!sourceChainId) return undefined

    if (isBitcoinChainId(sourceChainId)) {
      return isTestnet ? ChainId.BITCOIN_TESTNET : ChainId.BITCOIN
    }

    if (isEthereumChainId(sourceChainId)) {
      return ChainId.ETHEREUM_HOMESTEAD
    }

    return isTestnet
      ? ChainId.AVALANCHE_TESTNET_ID
      : ChainId.AVALANCHE_MAINNET_ID
  }, [bridgeTransaction, isTestnet])

  const { getNetwork } = useNetworks()
  const network = getNetwork(chainId)
  const tokens = useNetworkContractTokens(network)
  const symbol = bridgeTransaction?.asset.symbol

  return useMemo(() => {
    const token = tokens.find(t => t.symbol === symbol)

    if (token) return token

    if (symbol === BITCOIN_NETWORK.networkToken.symbol) {
      return BITCOIN_NETWORK.networkToken
    } else if (
      chainId &&
      isEthereumChainId(chainId) &&
      network?.networkToken.symbol === symbol
    ) {
      return network?.networkToken
    }

    return undefined
  }, [tokens, symbol, network, chainId])
}
