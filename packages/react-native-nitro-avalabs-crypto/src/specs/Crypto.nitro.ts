// /Users/szymonkapala/work/avalabs/core-mobile/packages/react-native-nitro-avalabs-crypto/src/specs/Crypto.nitro.ts
import type { HybridObject } from 'react-native-nitro-modules';

// Use ArrayBuffer in specs (Nitro’s zero-copy binary type)

export type HexLike = string | ArrayBuffer;

/** Result of x-only tweak add — mirrors libsecp: x-only pubkey + parity (0 even, 1 odd). */
export type XOnlyTweakResult = { xOnlyPubkey: ArrayBuffer; parity: 0 | 1 };

export interface Crypto extends HybridObject<{ ios: 'c++', android: 'c++' }> {
  // existing methods
  getPublicKeyFromString(secretKey: string, isCompressed?: boolean): ArrayBuffer;
  getPublicKeyFromArrayBuffer(secretKey: ArrayBuffer, isCompressed?: boolean): ArrayBuffer;

  // NEW additions:
  /**
   * Adds scalar*G to an existing public key P.
   * @param publicKey Hex string or ArrayBuffer representing P
   * @param tweak Hex string or ArrayBuffer representing scalar
   * @param isCompressed optional boolean
   * @returns ArrayBuffer for resulting public key
   */
  pointAddScalar(publicKey: HexLike, tweak: HexLike, isCompressed?: boolean): ArrayBuffer;

  /**
   * X-only tweak add: given an x-only public key P.x and scalar t, compute Q = P + t·G.
   * Returns null if the result is the point at infinity or the tweak is invalid (t == 0 or t ≥ n).
   * Mirrors secp256k1_xonly_pubkey_tweak_add semantics.
   * @param xOnly 32-byte x-only public key (ArrayBuffer or hex)
   * @param tweak 32-byte scalar (ArrayBuffer or hex)
   * @returns { xOnlyPubkey, parity } or null
   */
  xOnlyPointAddTweak(xOnly: HexLike, tweak: HexLike): XOnlyTweakResult | null;

  /**
   * Convenience: x-only tweak add that returns a full pubkey (compressed by default).
   * Returns null when result is infinity/invalid tweak. Intended for callers that need a full point.
   * @param xOnly 32-byte x-only public key
   * @param tweak 32-byte scalar
   * @param isCompressed whether to return a 33-byte compressed key (default true); if false returns 65-byte
   * @returns ArrayBuffer (33/65 bytes) or null
   */
  pointAddScalarXOnly(xOnly: HexLike, tweak: HexLike, isCompressed?: boolean): ArrayBuffer | null;

  /**
   * Generic sign (e.g., ECDSA) using secret key.
   * @param secretKey Hex string or ArrayBuffer
   * @param message Hex string or ArrayBuffer
   * @returns ArrayBuffer representing signature
   */
  sign(secretKey: HexLike, message: HexLike): ArrayBuffer;

  /**
   * Generic verify (e.g., ECDSA) using public key.
   * @param publicKey Hex string or ArrayBuffer
   * @param message Hex string or ArrayBuffer
   * @param signature Hex string or ArrayBuffer
   * @returns boolean
   */
  verify(publicKey: HexLike, message: HexLike, signature: HexLike): boolean;

  /**
   * Schnorr sign using secret key.
   * @param secretKey Hex string or ArrayBuffer
   * @param message Hash Hex string or ArrayBuffer (32 bytes)
   * @returns ArrayBuffer for Schnorr signature
   */
  signSchnorr(secretKey: HexLike, messageHash: HexLike, auxRand: HexLike): ArrayBuffer;

  /**
   * Schnorr verify using public key.
   * @param publicKey Hex string or ArrayBuffer
   * @param messageHash Hex string or ArrayBuffer (32 bytes)
   * @param signature Hex string or ArrayBuffer
   * @returns boolean
   */
  verifySchnorr(publicKey: HexLike, messageHash: HexLike, signature: HexLike): boolean;
}