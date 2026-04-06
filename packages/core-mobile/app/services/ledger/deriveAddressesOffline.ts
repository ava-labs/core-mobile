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
import { bip32 } from 'utils/bip32'

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
  const evmPubKey = bip32
    .fromBase58(evmXpub)
    .derive(0)
    .derive(evmAddressIndex).publicKey

  // Avalanche: derive from per-account xpub at m/44'/9000'/{accountIndex}'
  // Address is always at child path 0/0 within the account
  const avalanchePubKey = bip32
    .fromBase58(avalancheXpub)
    .derive(0)
    .derive(0).publicKey

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
