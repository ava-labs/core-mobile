import type { HybridObject } from 'react-native-nitro-modules'

// Use ArrayBuffer in specs (Nitro's zero-copy binary type)
export type HexLike = string | ArrayBuffer

/**
 * Native/bridge return type from the Nitro module for Ed25519 extended public key.
 * Used only across the JS–native boundary. Native returns this with pointBytes empty;
 * the TypeScript wrapper transforms it into ExtendedPublicKeyResult.
 */
export interface ExtendedPublicKey {
  head: ArrayBuffer
  prefix: ArrayBuffer
  scalar: string // bigint as hex string (big-endian)
  pointBytes: ArrayBuffer
}

/**
 * Public API return type for Ed25519 extended public key derivation.
 *
 * This is what getExtendedPublicKey() returns. It is **not** the same as the native
 * ExtendedPublicKey: the wrapper converts ArrayBuffers to Uint8Array, parses scalar
 * to bigint (with modulo reduction), and derives point/pointBytes via @noble/curves
 * so the shape matches @noble/curves and web wallet usage. Callers should use this
 * type, not ExtendedPublicKey.
 */
export interface ExtendedPublicKeyResult {
  head: Uint8Array
  prefix: Uint8Array
  scalar: bigint
  point: { toRawBytes: () => Uint8Array }
  pointBytes: Uint8Array
}

/**
 * Batch-derived addresses for one account index (secp256k1 chains).
 * Returned by deriveAddressesFromXpubs.
 */
export interface DerivedSecp256k1Addresses {
  accountIndex: number
  evm: string // 0x-prefixed EIP-55 checksummed address
  btc: string // bech32 P2WPKH (bc1… / tb1…)
  avm: string // X-{bech32}
  pvm: string // P-{bech32}
  coreEth: string // C-{bech32}
}

/**
 * Avalanche-network address bundle returned by deriveAddressesForAvalanche.
 * The C-chain bech32 deliberately uses the EVM-derived pubkey with the
 * avax/fuji HRP — that's why the API takes an evmPublicKey alongside the
 * avalanchePublicKey.
 */
export interface DerivedAvalancheAddresses {
  x: string // X-{bech32}, from avalanche pubkey
  p: string // P-{bech32}, from avalanche pubkey
  coreEth: string // C-{bech32}, from evm pubkey
}

export interface Crypto extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  // existing methods
  getPublicKeyFromString(secretKey: string, isCompressed?: boolean): ArrayBuffer
  getPublicKeyFromArrayBuffer(
    secretKey: ArrayBuffer,
    isCompressed?: boolean
  ): ArrayBuffer

  // NEW additions:
  /**
   * Adds scalar*G to an existing public key P.
   * @param publicKey Hex string or ArrayBuffer representing P
   * @param tweak Hex string or ArrayBuffer representing scalar
   * @param isCompressed optional boolean
   * @returns ArrayBuffer for resulting public key
   */
  pointAddScalar(
    publicKey: HexLike,
    tweak: HexLike,
    isCompressed?: boolean
  ): ArrayBuffer

  /**
   * Generic sign (e.g., ECDSA) using secret key.
   * @param secretKey Hex string or ArrayBuffer
   * @param message Hex string or ArrayBuffer
   * @returns ArrayBuffer representing signature
   */
  sign(secretKey: HexLike, message: HexLike): ArrayBuffer

  /**
   * Generic verify (e.g., ECDSA) using public key.
   * @param publicKey Hex string or ArrayBuffer
   * @param message Hex string or ArrayBuffer
   * @param signature Hex string or ArrayBuffer
   * @returns boolean
   */
  verify(publicKey: HexLike, message: HexLike, signature: HexLike): boolean

  /**
   * Schnorr sign using secret key.
   * @param secretKey Hex string or ArrayBuffer
   * @param message Hash Hex string or ArrayBuffer (32 bytes)
   * @returns ArrayBuffer for Schnorr signature
   */
  signSchnorr(
    secretKey: HexLike,
    messageHash: HexLike,
    auxRand: HexLike
  ): ArrayBuffer

  /**
   * Schnorr verify using public key.
   * @param publicKey Hex string or ArrayBuffer
   * @param messageHash Hex string or ArrayBuffer (32 bytes)
   * @param signature Hex string or ArrayBuffer
   * @returns boolean
   */
  verifySchnorr(
    publicKey: HexLike,
    messageHash: HexLike,
    signature: HexLike
  ): boolean

  /**
   * Ed25519 extended public key derivation.
   * @param secretKey Hex string or ArrayBuffer (32 bytes)
   * @returns Extended public key object with all components
   */
  getExtendedPublicKey(secretKey: HexLike): ExtendedPublicKey

  /**
   * Batch-derive addresses for secp256k1 chains from BIP32 extended public keys.
   * Runs entirely on a native background thread so the JS thread stays free.
   *
   * The EVM xpub is shared across accounts (m/44'/60'/0'); each account index
   * derives a different child at 0/{index}.
   *
   * Avalanche xpubs are per-account (m/44'/9000'/{account}'); the address is
   * always at child 0/0 within each xpub.  Therefore `avalancheXpubs` must be
   * the same length as `accountIndices` — one xpub per index.
   *
   * @param evmXpub         base58-encoded shared xpub at m/44'/60'/0'
   * @param avalancheXpubs  base58-encoded per-account xpubs, aligned with accountIndices
   * @param isTestnet       true → fuji HRP + tb1 BTC prefix; false → avax HRP + bc1
   * @param accountIndices  BIP32 address indices to derive (e.g. [0,1,2,…,9])
   * @returns one DerivedSecp256k1Addresses per index
   */
  deriveAddressesFromXpubs(
    evmXpub: string,
    avalancheXpubs: string[],
    isTestnet: boolean,
    accountIndices: number[]
  ): Promise<DerivedSecp256k1Addresses[]>

  /**
   * Derive EVM (EIP-55 checksummed) addresses from a batch of 33-byte
   * compressed secp256k1 public keys.
   *
   * Synchronous — per-pubkey work is keccak-256 + checksum (~50 µs).
   * Results are returned in the same order as `publicKeys`, so callers can
   * map address ↔ publicKey/accountIndex by position.
   *
   * @param publicKeys array of 33-byte compressed secp256k1 pubkeys
   * @returns array of 0x-prefixed EIP-55 addresses, one per input
   */
  deriveAddressesForEvm(publicKeys: ArrayBuffer[]): string[]

  /**
   * Derive Solana addresses (base58-encoded Ed25519 public keys) from a
   * batch of 32-byte Ed25519 public keys.
   *
   * Synchronous — base58 encoding only.
   * Results are returned in the same order as `publicKeys`.
   *
   * @param publicKeys array of 32-byte Ed25519 pubkeys
   * @returns array of base58-encoded addresses, one per input
   */
  deriveAddressesForSvm(publicKeys: ArrayBuffer[]): string[]

  /**
   * Derive Bitcoin P2WPKH bech32 addresses from a batch of 33-byte
   * compressed secp256k1 public keys.
   *
   * In this codebase BTC and EVM share the same derivation path
   * (m/44'/60'/0'/0/{i}), so the same compressed pubkey works for both.
   *
   * Synchronous — Hash160 + bech32 (~30 µs per input).
   * Results are returned in the same order as `publicKeys`.
   *
   * @param publicKeys array of 33-byte compressed secp256k1 pubkeys
   * @param isTestnet  true → tb1… (testnet); false → bc1… (mainnet)
   * @returns array of bech32 addresses, one per input
   */
  deriveAddressesForBtc(publicKeys: ArrayBuffer[], isTestnet: boolean): string[]

  /**
   * Derive Avalanche-network address bundles (X-, P-, C-bech32) from a
   * batch of pubkey pairs supplied as two parallel arrays.
   *
   * - X-/P-:   computed from `avalanchePublicKeys[i]` (m/44'/9000'/{i}'/0/0)
   * - CoreEth: computed from `evmPublicKeys[i]`       (m/44'/60'/0'/0/{i})
   *
   * The C-chain bech32 deliberately uses the EVM-derived pubkey with the
   * avax/fuji HRP (see derive_addresses_for_index in address_derivation.hpp).
   *
   * `avalanchePublicKeys` and `evmPublicKeys` must have the same length;
   * results are returned in that same order so callers can map by
   * publicKey/accountIndex by position.
   *
   * Synchronous — 2× Hash160 + 3× bech32 (~80 µs per pair).
   *
   * @param avalanchePublicKeys array of 33-byte compressed secp256k1 pubkeys at m/44'/9000'/…
   * @param evmPublicKeys       array of 33-byte compressed secp256k1 pubkeys at m/44'/60'/…
   * @param isTestnet           true → fuji HRP; false → avax HRP
   * @returns array of { x, p, coreEth } bech32 bundles, one per pair
   */
  deriveAddressesForAvalanche(
    avalanchePublicKeys: ArrayBuffer[],
    evmPublicKeys: ArrayBuffer[],
    isTestnet: boolean
  ): DerivedAvalancheAddresses[]
}
