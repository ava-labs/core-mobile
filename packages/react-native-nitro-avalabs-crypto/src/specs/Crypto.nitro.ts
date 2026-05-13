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
 * All addresses for one account index derived from BIP39 seed.
 * Returned by deriveAllAddressesFromSeed.
 */
export interface DerivedAllAddresses {
  accountIndex: number
  evm: string // 0x-prefixed EIP-55 checksummed address
  btc: string // bech32 P2WPKH (bc1… / tb1…)
  avm: string // X-{bech32}
  pvm: string // P-{bech32}
  coreEth: string // C-{bech32}
  solana: string // base58-encoded Ed25519 public key
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
   * Derive ALL addresses (secp256k1 + Ed25519) from a single 32-byte raw
   * private key.  Used by the imported-private-key flow, where the same
   * 32-byte secret feeds both curves: secp256k1 for EVM / BTC / Avalanche
   * chains, and Ed25519 for Solana (RFC 8032 §5.1.5 — SHA-512 + clamp +
   * scalar × base, no SLIP-0010 derivation path since there is no seed).
   *
   * Synchronous — single-key work is dominated by one secp256k1
   * pubkey_create + one Ed25519 pubkey derivation + a few hashes (<1 ms in
   * practice). Bridge overhead of an async Promise would dwarf it.
   *
   * The returned `accountIndex` is always 0 — there is no derivation index
   * for a raw imported key. The field is kept for ABI parity with the
   * seed-based batch result.
   *
   * @param privateKey  32-byte ArrayBuffer holding the raw secret. The same
   *                    bytes are interpreted as a secp256k1 scalar
   *                    (validated against curve order) AND as an Ed25519
   *                    secret (any bit pattern is valid after clamping).
   * @param isTestnet   true → fuji HRP + tb1 BTC prefix; false → avax + bc1
   * @returns one DerivedAllAddresses computed from the key
   */
  deriveAllAddressesFromPrivateKey(
    privateKey: ArrayBuffer,
    isTestnet: boolean
  ): DerivedAllAddresses

  /**
   * Derive ALL addresses (secp256k1 + Ed25519) for multiple account indices
   * from a BIP39 seed in a single native call.  Runs entirely on a native
   * background thread — the JS thread does zero crypto work.
   *
   * Internally performs:
   * - BIP32 root from seed (HMAC-SHA512, once)
   * - EVM xpub at m/44'/60'/0' (hardened, once)
   * - Per account: Avalanche xpub at m/44'/9000'/{i}' (hardened)
   * - Per account: all secp256k1 addresses from xpubs
   * - Per account: Solana via SLIP-0010 m/44'/501'/{i}'/0'
   * - Seed bytes zeroed with OPENSSL_cleanse after use
   *
   * @param seed           64-byte BIP39 seed (ArrayBuffer)
   * @param accountIndices account indices to derive
   * @param isTestnet      true → fuji/tb1; false → avax/bc1
   * @returns one DerivedAllAddresses per index
   */
  deriveAllAddressesFromSeed(
    seed: ArrayBuffer,
    accountIndices: number[],
    isTestnet: boolean
  ): Promise<DerivedAllAddresses[]>
}
