import type { HybridObject } from 'react-native-nitro-modules'

// Use ArrayBuffer in specs (Nitro's zero-copy binary type)
export type HexLike = string | ArrayBuffer

/**
 * Extended public key result from Ed25519 derivation
 */
export interface ExtendedPublicKey {
  head: ArrayBuffer
  prefix: ArrayBuffer
  scalar: string // bigint as hex string (big-endian)
  pointBytes: ArrayBuffer
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
}
