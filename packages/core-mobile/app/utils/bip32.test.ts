import { mnemonicToSeedSync } from 'bip39'
import { bip32, derivePublicKey, extendedPublicKeyToXpub } from './bip32'

const TEST_MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

function xpubForPath(mnemonic: string, path: string): string {
  const seed = mnemonicToSeedSync(mnemonic)
  return bip32.fromSeed(seed).derivePath(path).neutered().toBase58()
}

describe('derivePublicKey', () => {
  const evmXpub = xpubForPath(TEST_MNEMONIC, "m/44'/60'/0'")

  it('derives the same public key as manual bip32 traversal', () => {
    const expected = bip32.fromBase58(evmXpub).derive(0).derive(0).publicKey

    const result = derivePublicKey(evmXpub, 0, 0)

    expect(result.toString('hex')).toBe(expected.toString('hex'))
  })

  it('derives different keys for different address indices', () => {
    const key0 = derivePublicKey(evmXpub, 0, 0)
    const key1 = derivePublicKey(evmXpub, 0, 1)

    expect(key0.toString('hex')).not.toBe(key1.toString('hex'))
  })

  it('supports single child index', () => {
    const expected = bip32.fromBase58(evmXpub).derive(0).publicKey

    const result = derivePublicKey(evmXpub, 0)

    expect(result.toString('hex')).toBe(expected.toString('hex'))
  })

  it('supports deep derivation paths', () => {
    const expected = bip32
      .fromBase58(evmXpub)
      .derive(0)
      .derive(1)
      .derive(2).publicKey

    const result = derivePublicKey(evmXpub, 0, 1, 2)

    expect(result.toString('hex')).toBe(expected.toString('hex'))
  })

  it('returns the xpub public key itself with no child indices', () => {
    const expected = bip32.fromBase58(evmXpub).publicKey

    const result = derivePublicKey(evmXpub)

    expect(result.toString('hex')).toBe(expected.toString('hex'))
  })
})

describe('extendedPublicKeyToXpub', () => {
  it('preserves the public key and chain code through round-trip', () => {
    const evmXpub = xpubForPath(TEST_MNEMONIC, "m/44'/60'/0'")
    const node = bip32.fromBase58(evmXpub)
    const publicKeyHex = node.publicKey.toString('hex')
    const chainCodeHex = node.chainCode.toString('hex')

    const result = extendedPublicKeyToXpub(publicKeyHex, chainCodeHex)
    const reconstructed = bip32.fromBase58(result)

    expect(reconstructed.publicKey.toString('hex')).toBe(publicKeyHex)
    expect(reconstructed.chainCode.toString('hex')).toBe(chainCodeHex)
  })

  it('works for Avalanche key material', () => {
    const avaxXpub = xpubForPath(TEST_MNEMONIC, "m/44'/9000'/0'")
    const node = bip32.fromBase58(avaxXpub)
    const publicKeyHex = node.publicKey.toString('hex')
    const chainCodeHex = node.chainCode.toString('hex')

    const result = extendedPublicKeyToXpub(publicKeyHex, chainCodeHex)
    const reconstructed = bip32.fromBase58(result)

    expect(reconstructed.publicKey.toString('hex')).toBe(publicKeyHex)
    expect(reconstructed.chainCode.toString('hex')).toBe(chainCodeHex)
  })

  it('produces an xpub that can be used with derivePublicKey', () => {
    const avaxXpub = xpubForPath(TEST_MNEMONIC, "m/44'/9000'/0'")
    const node = bip32.fromBase58(avaxXpub)
    const publicKeyHex = node.publicKey.toString('hex')
    const chainCodeHex = node.chainCode.toString('hex')

    const reconstructed = extendedPublicKeyToXpub(publicKeyHex, chainCodeHex)
    const pubKey = derivePublicKey(reconstructed, 0, 0)
    const expected = derivePublicKey(avaxXpub, 0, 0)

    expect(pubKey.toString('hex')).toBe(expected.toString('hex'))
  })
})
