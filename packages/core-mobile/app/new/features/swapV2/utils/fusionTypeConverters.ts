import type { Network } from '@avalabs/core-chains-sdk'
import { TokenType as AppTokenType } from '@avalabs/vm-module-types'
import {
  TokenType as SdkTokenType,
  type Asset,
  type Chain,
  type Caip2ChainId
} from '@avalabs/unified-asset-transfer'
import type { Address as EvmAddress } from 'viem'
import type { Address as SolanaAddress } from '@solana/kit'
import type { LocalTokenWithBalance } from 'store/balance'
import { isSolanaNetwork } from 'utils/network/isSolanaNetwork'

/**
 * Type conversion utilities for Fusion SDK integration
 *
 * Converts between the app's type system and the Fusion SDK's type system.
 */

/**
 * Converts LocalTokenWithBalance to Fusion SDK Asset format
 *
 * @param token - App's token representation with balance
 * @param network - Network that the token belongs to
 * @returns SDK's Asset format (discriminated union)
 * @throws Error if token type is not supported
 */
export function toSwappableAsset(
  token: LocalTokenWithBalance,
  network: Network
): Asset {
  if (token.type === AppTokenType.ERC721) {
    throw new Error('ERC721 tokens are not supported for swaps')
  }

  if (token.type === AppTokenType.ERC1155) {
    throw new Error('ERC1155 tokens are not supported for swaps')
  }

  // All swappable tokens have decimals
  if (!('decimals' in token) || typeof token.decimals !== 'number') {
    throw new Error('Token must have decimals for swaps')
  }

  // Handle native tokens (no address required)
  if (token.type === AppTokenType.NATIVE) {
    return {
      type: SdkTokenType.NATIVE,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals
    }
  }

  // Handle ERC20 tokens (require EVM address format)
  if (token.type === AppTokenType.ERC20) {
    if (!('address' in token) || !token.address) {
      throw new Error('ERC20 token must have an address')
    }
    return {
      type: SdkTokenType.ERC20,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      address: token.address as EvmAddress
    }
  }

  // Handle SPL tokens (require Solana address format)
  if (isSolanaNetwork(network)) {
    if (!('address' in token) || !token.address) {
      throw new Error('SPL token must have an address')
    }
    return {
      type: SdkTokenType.SPL,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      address: token.address as SolanaAddress
    }
  }

  throw new Error(`Unsupported token type: ${token.type}`)
}

/**
 * Converts app Network to Fusion SDK Chain format
 *
 * @param network - App's network representation
 * @returns SDK's Chain format
 * @throws Error if network is missing required fields
 */
export function toChain(network: Network): Chain {
  // Require CAIP-2 chain ID (e.g., "eip155:1" for Ethereum mainnet)
  if (!network.caip2Id) {
    throw new Error(`Network ${network.chainName} is missing caip2Id`)
  }
  const caip2ChainId = network.caip2Id as Caip2ChainId

  // Convert network token to SDK's NativeAsset format
  const networkToken: Asset = {
    type: SdkTokenType.NATIVE,
    name: network.networkToken.name,
    symbol: network.networkToken.symbol,
    decimals: network.networkToken.decimals
  }

  const chain: Chain = {
    chainId: caip2ChainId,
    chainName: network.chainName,
    networkToken,
    rpcUrl: network.rpcUrl
  }

  // Add utility addresses if available
  if (network.utilityAddresses?.multicall) {
    chain.utilityAddresses = {
      multicall: network.utilityAddresses.multicall as EvmAddress
    }
  }

  return chain
}
