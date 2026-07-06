/**
 * Offline address derivation from raw public keys (LedgerLive path).
 *
 * Derives all chain addresses (EVM, BTC, Avalanche X/P, CoreEth) directly from
 * address-level public keys returned by the Ledger device — no BIP32 child
 * derivation needed. The BIP44/xpub path lives in @avalabs/crypto-sdk; see
 * features/ledger/utils/deriveLedgerAddressesFromXpubs.
 */
import {
  getEvmAddressFromPubKey,
  getBtcAddressFromPubKey
} from '@avalabs/core-wallets-sdk'
import { secp256k1, utils, networkIDs } from '@avalabs/avalanchejs'
import { networks } from 'bitcoinjs-lib'

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
