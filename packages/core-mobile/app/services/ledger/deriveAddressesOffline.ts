/**
 * Offline address derivation from extended public keys (xpubs) or raw public keys.
 *
 * This module allows deriving all chain addresses (EVM, BTC, Avalanche X/P, CoreEth)
 * without communicating with the Ledger device. It is used during multi-account
 * discovery to avoid redundant APDU calls — once we have xpubs (BIP44) or public
 * keys (LedgerLive) from the device, all addresses can be computed locally.
 */
import {
  getEvmAddressFromPubKey,
  getBtcAddressFromPubKey
} from '@avalabs/core-wallets-sdk'
import { secp256k1, utils, networkIDs } from '@avalabs/avalanchejs'
import { networks } from 'bitcoinjs-lib'
import { deriveAddressesFromXpubs as nativeDeriveAddresses } from 'react-native-nitro-avalabs-crypto'
import Logger from 'utils/Logger'
import { derivePublicKey } from 'utils/bip32'

export interface DerivedAddresses {
  evm: string
  btc: string
  avm: string
  pvm: string
  coreEth: string
}

/**
 * Derives an Avalanche bech32 address from a compressed secp256k1 public key.
 * Algorithm: pubkey → SHA-256 → RIPEMD-160 → bech32(hrp, hash)
 */
function avalancheBech32FromPubKey(
  pubKey: Buffer | Uint8Array,
  hrp: string
): string {
  const addressBytes = secp256k1.publicKeyBytesToAddress(
    Uint8Array.from(pubKey)
  )
  return utils.formatBech32(hrp, addressBytes)
}

/**
 * Derive all chain addresses from BIP44 extended public keys.
 *
 * For BIP44 EVM: the xpub at index 0 is at account level (m/44'/60'/0').
 * All EVM accounts share this xpub — different accounts are at different
 * address indices: m/44'/60'/0'/0/{accountIndex}.
 *
 * For BIP44 Avalanche: each account has its own xpub at m/44'/9000'/{accountIndex}'.
 * The address is at child 0/0 within each account xpub.
 *
 * @param evmXpub - Base58-encoded xpub at m/44'/60'/0' (account level, shared)
 * @param avalancheXpub - Base58-encoded xpub at m/44'/9000'/{accountIndex}'
 * @param isTestnet - Whether to use testnet HRP/network params
 * @param evmAddressIndex - The address index for EVM derivation (default 0)
 */
export function deriveAddressesFromXpub(
  evmXpub: string,
  avalancheXpub: string,
  isTestnet: boolean,
  evmAddressIndex = 0
): DerivedAddresses {
  const hrp = isTestnet ? networkIDs.FujiHRP : networkIDs.MainnetHRP
  const btcNetwork = isTestnet ? networks.testnet : networks.bitcoin

  // EVM: derive from shared account-level xpub at m/44'/60'/0'
  // Address for account N is at child path 0/{N}
  const evmPubKey = derivePublicKey(evmXpub, 0, evmAddressIndex)

  // Avalanche: derive from per-account xpub at m/44'/9000'/{accountIndex}'
  // Address is always at child path 0/0 within the account
  const avalanchePubKey = derivePublicKey(avalancheXpub, 0, 0)

  const avaxBech32 = avalancheBech32FromPubKey(avalanchePubKey, hrp)
  const coreEthBech32 = avalancheBech32FromPubKey(evmPubKey, hrp)

  return {
    evm: getEvmAddressFromPubKey(evmPubKey),
    btc: getBtcAddressFromPubKey(evmPubKey, btcNetwork),
    avm: `X-${avaxBech32}`,
    pvm: `P-${avaxBech32}`,
    coreEth: `C-${coreEthBech32}`
  }
}

/**
 * Derive all chain addresses from raw public keys (LedgerLive).
 *
 * For LedgerLive, the public keys are already at the address level
 * (e.g. m/44'/60'/{accountIndex}'/0/0), so no BIP32 child derivation is needed.
 *
 * @param evmPubKeyHex - Hex-encoded compressed public key at the EVM address path
 * @param avalanchePubKeyHex - Hex-encoded compressed public key at the Avalanche address path
 * @param isTestnet - Whether to use testnet HRP/network params
 */
export function deriveAddressesFromPublicKeys(
  evmPubKeyHex: string,
  avalanchePubKeyHex: string,
  isTestnet: boolean
): DerivedAddresses {
  const hrp = isTestnet ? networkIDs.FujiHRP : networkIDs.MainnetHRP
  const btcNetwork = isTestnet ? networks.testnet : networks.bitcoin

  const evmPubKey = Buffer.from(evmPubKeyHex, 'hex')
  const avalanchePubKey = Buffer.from(avalanchePubKeyHex, 'hex')

  const avaxBech32 = avalancheBech32FromPubKey(avalanchePubKey, hrp)
  const coreEthBech32 = avalancheBech32FromPubKey(evmPubKey, hrp)

  return {
    evm: getEvmAddressFromPubKey(evmPubKey),
    btc: getBtcAddressFromPubKey(evmPubKey, btcNetwork),
    avm: `X-${avaxBech32}`,
    pvm: `P-${avaxBech32}`,
    coreEth: `C-${coreEthBech32}`
  }
}

/**
 * Batch-derive addresses for multiple account indices using the native
 * Nitro module. Runs entirely on a native background thread so the JS
 * thread stays free for UI and BLE events.
 *
 * `avalancheXpubs` must be aligned 1-to-1 with `accountIndices` because
 * each Avalanche xpub is per-account (m/44'/9000'/{account}') while the
 * EVM xpub is shared across all accounts.
 *
 * Falls back to the JS implementation on error (e.g. in test environments
 * where the native module is unavailable).
 */
export async function deriveAddressesBatch(
  evmXpub: string,
  avalancheXpubs: string[],
  isTestnet: boolean,
  accountIndices: number[]
): Promise<Map<number, DerivedAddresses>> {
  if (avalancheXpubs.length !== accountIndices.length) {
    throw new Error(
      `deriveAddressesBatch requires avalancheXpubs and accountIndices to have the same length; received ${avalancheXpubs.length} avalanche xpubs for ${accountIndices.length} account indices.`
    )
  }
  try {
    const results = await nativeDeriveAddresses(
      evmXpub,
      avalancheXpubs,
      isTestnet,
      accountIndices
    )

    const map = new Map<number, DerivedAddresses>()
    for (const r of results) {
      map.set(r.accountIndex, {
        evm: r.evm,
        btc: r.btc,
        avm: r.avm,
        pvm: r.pvm,
        coreEth: r.coreEth
      })
    }
    return map
  } catch (error) {
    Logger.error(
      'Native deriveAddressesFromXpubs failed, falling back to JS',
      error
    )
    // Fallback derives one index at a time using the JS implementation.
    // Mirrors the native side's all-or-nothing contract: any per-index
    // failure propagates so callers can rely on every requested index being
    // present in the returned map, or none at all.
    const map = new Map<number, DerivedAddresses>()
    for (let i = 0; i < accountIndices.length; i++) {
      const accountIndex = accountIndices[i]
      const avalancheXpub = avalancheXpubs[i]
      if (accountIndex === undefined || avalancheXpub === undefined) {
        throw new Error(
          `deriveAddressesBatch fallback: missing input at offset ${i}`
        )
      }
      map.set(
        accountIndex,
        deriveAddressesFromXpub(evmXpub, avalancheXpub, isTestnet, accountIndex)
      )
    }
    return map
  }
}
