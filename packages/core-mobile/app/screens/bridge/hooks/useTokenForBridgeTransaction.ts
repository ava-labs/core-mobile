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
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'
import { isEthereumChainId } from 'services/network/utils/isEthereumNetwork'
import { Blockchain, BridgeTransaction } from '@avalabs/core-bridge-sdk'
import { isUnifiedBridgeTransfer } from '../utils/bridgeUtils'

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

function getSourceChainId(
  bridgeTransaction: BridgeTransaction | BridgeTransfer | undefined,
  isTestnet: boolean
): number | undefined {
  if (isUnifiedBridgeTransfer(bridgeTransaction)) {
    return getSourceChainIdForUnifiedBridgeTransaction(
      bridgeTransaction,
      isTestnet
    )
  } else {
    return getSourceChainIdForLegacyBridgeTransaction(
      bridgeTransaction,
      isTestnet
    )
  }
}

function getSourceChainIdForLegacyBridgeTransaction(
  bridgeTransaction: BridgeTransaction | undefined,
  isTestnet: boolean
): number {
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
}

function getSourceChainIdForUnifiedBridgeTransaction(
  bridgeTransaction: BridgeTransfer,
  isTestnet: boolean
): number | undefined {
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

  return isTestnet ? ChainId.AVALANCHE_TESTNET_ID : ChainId.AVALANCHE_MAINNET_ID
}
