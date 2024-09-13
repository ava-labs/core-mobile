import { Blockchain } from '@avalabs/core-bridge-sdk'
import { chainIdToCaip } from 'utils/data/caip'
import { ChainId } from '@avalabs/core-chains-sdk'
import {
  BridgeAsset,
  isErc20Asset,
  isNativeAsset
} from '@avalabs/bridge-unified'
import { isUnifiedBridgeAsset } from '../../utils/bridgeUtils'
import { AssetBalance } from '../../utils/types'

export const getTargetChainId = (
  isDeveloperMode: boolean,
  targetBlockchain: Blockchain
): number => {
  switch (targetBlockchain) {
    case Blockchain.AVALANCHE:
      return isDeveloperMode
        ? ChainId.AVALANCHE_TESTNET_ID
        : ChainId.AVALANCHE_MAINNET_ID

    case Blockchain.BITCOIN:
      return isDeveloperMode ? ChainId.BITCOIN_TESTNET : ChainId.BITCOIN
    case Blockchain.ETHEREUM:
    default:
      // NOTE: this will only happen for Ethereum and is safe for now,
      // since we're only using this piece of code for Unified Bridge (CCTP).
      // Needs revisiting when we migrate Avalanche Bridge to @avalabs/bridge-unified package.
      return isDeveloperMode
        ? ChainId.ETHEREUM_TEST_SEPOLIA
        : ChainId.ETHEREUM_HOMESTEAD
  }
}

export const getIsAssetSupported = (
  selectedAsset: AssetBalance | undefined,
  assets: BridgeAsset[],
  targetChainId: number
): boolean => {
  if (!selectedAsset || !isUnifiedBridgeAsset(selectedAsset.asset)) return false

  if (isNativeAsset(selectedAsset.asset)) {
    return true
  }

  const lookupAddress = selectedAsset.asset.address ?? ''

  const asset = assets.find(_asset => {
    return isErc20Asset(_asset) && lookupAddress === _asset.address
  })

  if (!asset) {
    return false
  }

  return chainIdToCaip(targetChainId) in asset.destinations
}

export const getSourceBalance = (
  selectedAsset: BridgeAsset | undefined,
  assetsWithBalances: AssetBalance[]
): AssetBalance | undefined => {
  if (!selectedAsset) {
    return undefined
  }

  return assetsWithBalances.find(({ asset }) => {
    return asset.symbol === selectedAsset.symbol
  })
}
