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
 * Batch-derived Solana address for one account index.
 * Returned by deriveSolanaAddressesFromSeed.
 */
export interface DerivedSolanaAddress {
  accountIndex: number
  address: string // base58-encoded 32-byte Ed25519 public key
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
   * @param evmXpub      base58-encoded xpub (e.g. at m/44'/60'/0')
   * @param avalancheXpub base58-encoded xpub (e.g. at m/44'/9000'/{account}')
   * @param isTestnet    true → fuji HRP + tb1 BTC prefix; false → avax HRP + bc1
   * @param accountIndices BIP32 address indices to derive (e.g. [0,1,2,…,9])
   * @returns one DerivedSecp256k1Addresses per index
   */
  deriveAddressesFromXpubs(
    evmXpub: string,
    avalancheXpub: string,
    isTestnet: boolean,
    accountIndices: number[]
  ): Promise<DerivedSecp256k1Addresses[]>

  /**
   * Batch-derive Solana addresses from a BIP39 seed using SLIP-0010 Ed25519
   * hardened derivation.  Runs entirely on a native background thread.
   *
   * Derivation path per index: m/44'/501'/{accountIndex}'/0'
   *
   * @param seed       64-byte BIP39 seed (ArrayBuffer)
   * @param accountIndices account indices to derive
   * @returns one DerivedSolanaAddress per index
   */
  deriveSolanaAddressesFromSeed(
    seed: ArrayBuffer,
    accountIndices: number[]
  ): Promise<DerivedSolanaAddress[]>
}
