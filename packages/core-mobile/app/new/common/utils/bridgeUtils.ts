import { ChainId } from '@avalabs/core-chains-sdk'
import { BridgeTransfer, Chain } from '@avalabs/bridge-unified'
import { Transaction } from 'store/transaction'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'
import { isBitcoinChainId } from 'utils/network/isBitcoinNetwork'
import { isEthereumChainId } from 'services/network/utils/isEthereumNetwork'
import { isAvalancheChainId } from 'services/network/utils/isAvalancheNetwork'

export function isPendingBridgeTransaction(
  item: Transaction | BridgeTransfer
): item is BridgeTransfer {
  return 'sourceChain' in item
}

export function getSourceChainId(
  transfer: BridgeTransfer | undefined,
  isTestnet: boolean
): number | undefined {
  return getChainIdForChain(transfer?.sourceChain, isTestnet)
}

export function getTargetChainId(
  transfer: BridgeTransfer | undefined,
  isTestnet: boolean
): number | undefined {
  return getChainIdForChain(transfer?.targetChain, isTestnet)
}

export function getChainIdForChain(
  chain: Chain | undefined,
  isTestnet: boolean
): number | undefined {
  const chainId = chain?.chainId
    ? getChainIdFromCaip2(chain?.chainId)
    : undefined

  if (!chainId) return undefined

  if (isBitcoinChainId(chainId)) {
    return isTestnet ? ChainId.BITCOIN_TESTNET : ChainId.BITCOIN
  }

  if (isEthereumChainId(chainId)) {
    return isTestnet
      ? ChainId.ETHEREUM_TEST_SEPOLIA
      : ChainId.ETHEREUM_HOMESTEAD
  }

  if (isAvalancheChainId(chainId)) {
    return isTestnet
      ? ChainId.AVALANCHE_TESTNET_ID
      : ChainId.AVALANCHE_MAINNET_ID
  }

  return chainId
}

export function getBridgeAssetSymbol(
  transfer: BridgeTransfer | undefined
): string | undefined {
  return transfer?.asset.symbol
}
