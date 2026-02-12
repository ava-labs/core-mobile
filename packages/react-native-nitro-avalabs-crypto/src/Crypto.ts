/* eslint-disable no-bitwise */
import { NitroModules } from 'react-native-nitro-modules'
import type { Crypto } from './specs/Crypto.nitro'

const con = console

// Native hybrid object
const NativeCrypto = NitroModules.createHybridObject<Crypto>('Crypto')

/** Strip 0x, validate, and normalize hex to even length (left-pad with one '0' if needed). */
function normalizeHex(hex: string): string {
  let h = hex.startsWith('0x') || hex.startsWith('0X') ? hex.slice(2) : hex
  if (!/^[0-9a-fA-F]*$/.test(h)) throw new TypeError('Invalid hex string')
  if (h.length % 2) h = '0' + h
  return h.toLowerCase()
}

/** Convert hex string to a fresh ArrayBuffer. */
function hexToArrayBuffer(hex: string): ArrayBuffer {
  const h = normalizeHex(hex)
  const len = h.length / 2
  const out = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16)
  }
  return out.buffer
}

/** Convert a Uint8Array or ArrayBuffer to a tight ArrayBuffer view. */
function toArrayBuffer(input: Uint8Array | ArrayBuffer): ArrayBuffer {
  if (input instanceof ArrayBuffer) return input
  // Make a tight copy that respects byteOffset/byteLength
  return input.buffer.slice(
    input.byteOffset,
    input.byteOffset + input.byteLength
  ) as ArrayBuffer
}

/** Accepts string (hex), ArrayBuffer, or Uint8Array and returns ArrayBuffer */
function hexLikeToArrayBuffer(
  input: string | ArrayBuffer | Uint8Array
): ArrayBuffer {
  if (typeof input === 'string') return hexToArrayBuffer(input)
  if (input instanceof ArrayBuffer) return input
  if (input instanceof Uint8Array) return toArrayBuffer(input)
  throw new TypeError('Expected hex string, ArrayBuffer, or Uint8Array')
}

/** Ensure a 32-byte buffer */
function ensure32(name: string, ab: ArrayBuffer): ArrayBuffer {
  if (ab.byteLength !== 32) throw new TypeError(`${name} must be 32 bytes`)
  return ab
}

/** bigint → 32-byte ArrayBuffer (left-padded). Throws if it doesn't fit. */
function bigintToArrayBuffer32(n: bigint): ArrayBuffer {
  if (n < 0n) throw new TypeError('Secret key must be non-negative')
  const out = new Uint8Array(32)
  let i = 31
  let v = n
  while (v > 0n) {
    if (i < 0) throw new RangeError('bigint does not fit into 32 bytes')
    out[i] = Number(v & 0xffn)
    v >>= 8n
    i--
  }
  return out.buffer
}

/** bigint → 64-char hex string (left-padded). Throws if it doesn't fit.
 * 
function bigintToHex64(n: bigint): string {
  if (n < 0n) throw new TypeError('Secret key must be non-negative')
  const hex = n.toString(16)
  if (hex.length > 64) throw new RangeError('bigint does not fit into 32 bytes')
  return hex.padStart(64, '0').toLowerCase()
}
*/

/**
 * Public JS API — accepts Uint8Array | ArrayBuffer | string | bigint.
 * Returns Uint8Array for ergonomic use in JS.
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
export function getPublicKey(
  secretKey: Uint8Array | ArrayBuffer | string | bigint,
  isCompressed = true
): Uint8Array {
  con.log('[Crypto] getPublicKey called with', typeof secretKey, isCompressed)
  let ab: ArrayBuffer | undefined
  let hex: string | undefined

  if (typeof secretKey === 'bigint') {
    con.log('[Crypto] Secret is bigint')
    // Prefer zero-copy native path via ArrayBuffer
    ab = bigintToArrayBuffer32(secretKey)
    // hex fallback available if needed: hex = bigintToHex64(secretKey);
  } else if (typeof secretKey === 'string') {
    con.log('[Crypto] Secret is string', secretKey.slice(0, 10) + '...')
    hex = normalizeHex(secretKey)
  } else {
    con.log(
      '[Crypto] Secret is buffer-like',
      secretKey instanceof Uint8Array,
      secretKey instanceof ArrayBuffer
    )
    ab = toArrayBuffer(secretKey)
  }

  let outBuf: ArrayBuffer
  if (ab && typeof NativeCrypto.getPublicKeyFromArrayBuffer === 'function') {
    con.log('[Crypto] Calling NativeCrypto.getPublicKeyFromArrayBuffer')
    outBuf = NativeCrypto.getPublicKeyFromArrayBuffer(ab, isCompressed)
  } else if (hex && typeof NativeCrypto.getPublicKeyFromString === 'function') {
    con.log('[Crypto] Calling NativeCrypto.getPublicKeyFromString')
    // Native returns ArrayBuffer already — no conversion needed
    outBuf = NativeCrypto.getPublicKeyFromString(hex, isCompressed)
  } else if (
    hex &&
    typeof NativeCrypto.getPublicKeyFromArrayBuffer === 'function'
  ) {
    con.log('[Crypto] Calling NativeCrypto.getPublicKeyFromArrayBuffer')
    outBuf = NativeCrypto.getPublicKeyFromArrayBuffer(
      hexToArrayBuffer(hex),
      isCompressed
    )
  } else if (ab && typeof NativeCrypto.getPublicKeyFromString === 'function') {
    con.log('[Crypto] Calling NativeCrypto.getPublicKeyFromString')
    // fallback: convert buffer to hex and use string method; native returns ArrayBuffer
    const bytes = new Uint8Array(ab)
    let h = ''
    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i]
      if (byte !== undefined) {
        h += byte.toString(16).padStart(2, '0')
      }
    }
    outBuf = NativeCrypto.getPublicKeyFromString(h, isCompressed)
  } else {
    throw new Error(
      'Native Crypto hybrid does not expose the expected methods.'
    )
  }

  con.log(
    '[Crypto] Native call succeeded, result byteLength:',
    outBuf.byteLength
  )
  con.log('[Crypto] Returning Uint8Array with length', outBuf.byteLength)
  try {
    const res = new Uint8Array(outBuf)
    con.log('[Crypto] getPublicKey completed')
    return res
  } catch (error) {
    con.error('[Crypto] getPublicKey failed', error)
    throw error
  }
}

// Optionally re-export the native methods (typed) if you want direct access:
export const getPublicKeyFromArrayBuffer =
  NativeCrypto.getPublicKeyFromArrayBuffer.bind(NativeCrypto)
export const getPublicKeyFromString =
  NativeCrypto.getPublicKeyFromString.bind(NativeCrypto)

/** Add scalar*G to existing public key (P + t*G). Returns Uint8Array. */
export function pointAddScalar(
  publicKey: string | ArrayBuffer | Uint8Array,
  tweak: string | ArrayBuffer | Uint8Array,
  isCompressed = true
): Uint8Array {
  con.log('[Crypto] pointAddScalar called')
  const pkAB = hexLikeToArrayBuffer(publicKey as unknown as string)
  const twAB = hexLikeToArrayBuffer(tweak as unknown as string)
  const out = NativeCrypto.pointAddScalar(pkAB, twAB, isCompressed)
  return new Uint8Array(out)
}

/** ECDSA sign. Message must be a 32-byte digest. Returns DER signature bytes. */
function isDerSignature(u8: Uint8Array): boolean {
  return u8.length >= 8 && u8[0] === 0x30
}

/** Convert 32-byte big-endian integer to minimal DER INTEGER (with zero prefix if high bit set). */
function be32ToDerInt(src: Uint8Array): Uint8Array {
  // Strip leading zeros
  let i = 0
  while (i < src.length - 1 && src[i] === 0) i++
  const v = src.subarray(i)
  // If high bit set, prepend 0x00 to force positive
  if ((v[0] ?? 0) & 0x80) {
    const out = new Uint8Array(v.length + 1)
    out[0] = 0x00
    out.set(v, 1)
    return out
  }
  return v
}

/** Convert a 64-byte compact ECDSA signature (r||s) to DER sequence. */
function compact64ToDer(sig64: Uint8Array): Uint8Array {
  if (sig64.length !== 64)
    throw new TypeError('compact ECDSA signature must be 64 bytes')
  const r = sig64.subarray(0, 32)
  const s = sig64.subarray(32, 64)
  const rDer = be32ToDerInt(r)
  const sDer = be32ToDerInt(s)
  const len = 2 + rDer.length + 2 + sDer.length // 0x02 rLen r 0x02 sLen s
  const out = new Uint8Array(2 + 2 + rDer.length + 2 + sDer.length)
  let p = 0
  out[p++] = 0x30 // SEQUENCE
  out[p++] = len
  out[p++] = 0x02 // INTEGER
  out[p++] = rDer.length
  out.set(rDer, p)
  p += rDer.length
  out[p++] = 0x02 // INTEGER
  out[p++] = sDer.length
  out.set(sDer, p)
  return out
}

export function sign(
  secretKey: string | ArrayBuffer | Uint8Array,
  message: string | ArrayBuffer | Uint8Array
): Uint8Array {
  con.log('[Crypto] sign called')
  const skAB = hexLikeToArrayBuffer(secretKey)
  const msgAB = hexLikeToArrayBuffer(message)
  if (msgAB.byteLength !== 32)
    throw new TypeError('ECDSA message must be 32 bytes')
  const out = NativeCrypto.sign(skAB, msgAB)
  let sig = new Uint8Array(out)
  // Normalize to compact(64) – many JS libs expect r||s
  if (isDerSignature(sig)) {
    con.log('[Crypto] sign: converting DER signature to compact(64)')
    sig = derToCompact64(sig)
  } else if (sig.length !== 64) {
    throw new TypeError(`ECDSA signature has unexpected length: ${sig.length}`)
  }
  return sig
}

/** Parse minimal ASN.1 DER ECDSA signature and return {r,s} raw big-endian bytes (unpadded). */
// eslint-disable-next-line sonarjs/cognitive-complexity
function parseDerEcdsa(sig: Uint8Array): { r: Uint8Array; s: Uint8Array } {
  if (sig.length < 8 || sig[0] !== 0x30)
    throw new TypeError('Invalid DER: no SEQ')
  let p = 1
  let len = sig[p++] ?? 0
  if (len & 0x80) {
    const n = len & 0x7f
    if (n === 0 || n > 2) throw new TypeError('Invalid DER: long len too big')
    if (p + n > sig.length) throw new TypeError('Invalid DER: length overflow')
    len = 0
    for (let i = 0; i < n; i++) len = (len << 8) | (sig[p++] ?? 0)
  }
  if (p + len !== sig.length) throw new TypeError('Invalid DER: len mismatch')
  if (sig[p++] !== 0x02) throw new TypeError('Invalid DER: missing r INTEGER')
  const rLen = sig[p++] ?? 0
  if (p + rLen > sig.length) throw new TypeError('Invalid DER: r overflow')
  let r = sig.subarray(p, p + rLen)
  p += rLen
  if (sig[p++] !== 0x02) throw new TypeError('Invalid DER: missing s INTEGER')
  const sLen = sig[p++] ?? 0
  if (p + sLen > sig.length) throw new TypeError('Invalid DER: s overflow')
  let s = sig.subarray(p, p + sLen)
  // Strip an optional leading 0x00 that enforces positive INTEGER
  if (r.length > 0 && r[0] === 0x00) r = r.subarray(1)
  if (s.length > 0 && s[0] === 0x00) s = s.subarray(1)
  return { r, s }
}

/** Convert DER ECDSA signature to compact 64-byte (r||s). */
function derToCompact64(sigDer: Uint8Array): Uint8Array<ArrayBuffer> {
  const { r, s } = parseDerEcdsa(sigDer)
  if (r.length > 32 || s.length > 32)
    throw new TypeError('Invalid DER: r/s too long')
  const out = new Uint8Array(64)
  out.set(r, 32 - r.length)
  out.set(s, 64 - s.length)
  return out
}

/** ECDSA verify. Message must be a 32-byte digest. Accepts DER or compact(64B) signature. */
/** Determine if signature is ASN.1 DER (starts with 0x30). */

export function verify(
  publicKey: string | ArrayBuffer | Uint8Array,
  message: string | ArrayBuffer | Uint8Array,
  signature: string | ArrayBuffer | Uint8Array
): boolean {
  con.log('[Crypto] verify called')
  const pkAB = hexLikeToArrayBuffer(publicKey)
  const msgAB = hexLikeToArrayBuffer(message)
  const sigAB0 = hexLikeToArrayBuffer(signature)
  if (msgAB.byteLength !== 32)
    throw new TypeError('ECDSA message must be 32 bytes')

  // Normalize signature to DER if it is compact-64
  let sigU8 = new Uint8Array(sigAB0)
  if (!isDerSignature(sigU8)) {
    if (sigU8.length === 64) {
      con.log('[Crypto] verify: converting compact(64) signature to DER')
      sigU8 = compact64ToDer(sigU8) as Uint8Array<ArrayBuffer>
    } else {
      con.log(
        '[Crypto] verify: non-DER signature with unexpected length',
        sigU8.length
      )
    }
  }
  return NativeCrypto.verify(pkAB, msgAB, sigU8.buffer)
}

/** Schnorr sign (BIP-340). messageHash must be 32 bytes. Returns 64-byte signature. */
/** Schnorr sign (BIP-340). messageHash must be 32 bytes. Returns 64-byte signature. */
export function signSchnorr(
  messageHash: string | ArrayBuffer | Uint8Array,
  secretKey: string | ArrayBuffer | Uint8Array,
  auxRand?: string | ArrayBuffer | Uint8Array
): Uint8Array {
  con.log('[Crypto] signSchnorr called (msg, sk, aux). args=', {
    msgType: typeof messageHash,
    skType: typeof secretKey,
    hasAux: auxRand !== undefined
  })

  const msgAB = ensure32(
    'Schnorr messageHash',
    hexLikeToArrayBuffer(messageHash)
  )
  const skAB = ensure32('Schnorr secretKey', hexLikeToArrayBuffer(secretKey))

  let auxAB: ArrayBuffer
  if (auxRand === undefined) {
    con.log('[Crypto] signSchnorr: using zero-filled auxRand')
    auxAB = new Uint8Array(32).buffer
  } else {
    auxAB = ensure32('Schnorr auxRand', hexLikeToArrayBuffer(auxRand))
    con.log(
      '[Crypto] signSchnorr: auxRand provided, byteLength=',
      (auxAB as ArrayBuffer).byteLength
    )
  }

  // Native expects (secretKey, messageHash, auxRand)
  const out = NativeCrypto.signSchnorr(skAB, msgAB, auxAB)
  const sig = new Uint8Array(out)
  con.log('[Crypto] signSchnorr: native returned', sig.length, 'bytes')
  return sig
}
/** Schnorr verify (BIP-340). messageHash must be 32 bytes. Signature must be 64 bytes. */
export function verifySchnorr(
  publicKey: string | ArrayBuffer | Uint8Array,
  messageHash: string | ArrayBuffer | Uint8Array,
  signature: string | ArrayBuffer | Uint8Array
): boolean {
  con.log('[Crypto] verifySchnorr called')
  const pkAB = hexLikeToArrayBuffer(publicKey)
  const msgAB = hexLikeToArrayBuffer(messageHash)
  const sigAB = hexLikeToArrayBuffer(signature)
  if (msgAB.byteLength !== 32)
    throw new TypeError('Schnorr messageHash must be 32 bytes')
  if (sigAB.byteLength !== 64)
    throw new TypeError('Schnorr signature must be 64 bytes')
  return NativeCrypto.verifySchnorr(pkAB, msgAB, sigAB)
}
