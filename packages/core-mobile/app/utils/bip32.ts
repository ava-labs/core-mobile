import { BIP32Factory } from 'bip32'

const ecc = require('@bitcoinerlab/secp256k1')
export const bip32 = BIP32Factory(ecc)

/**
 * Derives a child public key from a base58-encoded xpub by walking the
 * given child index path (e.g. [0, 3] for change=0, address=3).
 */
export function derivePublicKey(
  xpub: string,
  ...childIndices: number[]
): Buffer {
  let node = bip32.fromBase58(xpub)
  for (const idx of childIndices) {
    node = node.derive(idx)
  }
  return node.publicKey
}

/**
 * Reconstructs a base58-encoded xpub from a raw hex public key and chain code,
 * as returned by Ledger's getExtendedPublicKeys APDU.
 */
export function extendedPublicKeyToXpub(
  publicKeyHex: string,
  chainCodeHex: string
): string {
  return bip32
    .fromPublicKey(
      Buffer.from(publicKeyHex, 'hex'),
      Buffer.from(chainCodeHex, 'hex')
    )
    .toBase58()
}
