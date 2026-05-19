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
 * Addresses for one account derived from the Avalanche-path secp256k1 pubkey
 * (AVM + PVM) and the EVM-path secp256k1 pubkey (CoreEth). Returned by
 * deriveAddressesForAvax — the two pubkey arrays must be aligned by index.
 */
export interface DerivedAvaxAddresses {
  avm: string // X-{bech32}
  pvm: string // P-{bech32}
  coreEth: string // C-{bech32}
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
   * Batch-encode EVM (0x-prefixed EIP-55) addresses from compressed secp256k1
   * pubkeys. One address per input pubkey. Returns an array aligned with
   * `pubkeys`. Throws if any pubkey is not exactly 33 bytes.
   */
  deriveAddressesForEvm(pubkeys: ArrayBuffer[]): string[]

  /**
   * Batch-encode BTC P2WPKH bech32 addresses (bc1… / tb1…) from compressed
   * secp256k1 pubkeys (same EVM path as `deriveAddressesForEvm`). Returns one
   * address per input pubkey.
   */
  deriveAddressesForBTC(pubkeys: ArrayBuffer[], isTestnet: boolean): string[]

  /**
   * Batch-encode Avalanche addresses for one account each: AVM (X-…),
   * PVM (P-…), and CoreEth (C-…). The two arrays MUST be the same length and
   * aligned by index — `avaxPubkeys[i]` is the m/44'/9000'/{i}'/0/0 pubkey,
   * `evmPubkeys[i]` is the m/44'/60'/0'/0/{i} pubkey used for CoreEth.
   * HRP: `avax` on mainnet, `fuji` on testnet.
   */
  deriveAddressesForAvax(
    avaxPubkeys: ArrayBuffer[],
    evmPubkeys: ArrayBuffer[],
    isTestnet: boolean
  ): DerivedAvaxAddresses[]

  /**
   * Batch-encode Solana addresses (Base58 of the raw Ed25519 public key) from
   * 32-byte Ed25519 pubkeys. Returns one address per input pubkey.
   */
  deriveAddressesForSVM(pubkeys: ArrayBuffer[]): string[]
}
