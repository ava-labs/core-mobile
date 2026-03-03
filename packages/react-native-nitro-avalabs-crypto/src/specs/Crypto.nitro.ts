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
