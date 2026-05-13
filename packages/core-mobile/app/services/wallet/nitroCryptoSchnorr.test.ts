/**
 * Schnorr (BIP-340) test vector documentation + mock contract test.
 *
 * SCOPE: This test pins BIP-340 official test vector index 0 into the
 * repository as reachable constants, validates the vector strings are
 * well-formed, and exercises a local Jest mock of the Nitro module's
 * `signSchnorr` / `verifySchnorr` surfaces with those vector inputs.
 *
 * The local `jest.mock` here OVERRIDES the package-level auto-mock at
 * `packages/core-mobile/__mocks__/react-native-nitro-avalabs-crypto.js`
 * for this one test file.  We do NOT add `signSchnorr` / `verifySchnorr`
 * to the auto-mock because the auto-mock is consumed at module load by
 * `bip32`'s `testEcc` probe (via `@avalabs/core-wallets-sdk` →
 * `bitcoinjs-lib` → `bip32`).  If `ecc.signSchnorr` is truthy there,
 * testEcc invokes it and `Buffer.from(undefined)` crashes module load
 * for every test that touches the wallets-sdk import chain.
 *
 * WHAT THIS DOES *NOT* TEST:
 *   - The actual JS wrapper logic in `react-native-nitro-avalabs-crypto`'s
 *     `Crypto.ts` (input conversion, auxRand fallback, length validation).
 *     That wrapper imports `@noble/curves/ed25519` whose internal modules
 *     have a circular require back to the nitro package; Jest's resolver
 *     can't follow the workspace symlink through that chain, so loading
 *     the real wrapper in Jest is impractical.
 *   - The cryptographic correctness of signSchnorr / verifySchnorr.
 *     Those are implemented in C++ via `secp256k1_schnorrsig_sign32` /
 *     `_verify`, plus an in-native self-verify step that aborts at sign
 *     time if our wrapper produces a non-verifying signature.  Native
 *     correctness against the BIP-340 vectors below should be verified
 *     in an on-device integration test, not in Jest.
 *
 * Reference: https://github.com/bitcoin/bips/blob/master/bip-0340/test-vectors.csv
 */

// Local mock overrides the package-level auto-mock for this file only.
// Surfaces unused by this test are stubbed as jest.fn() so the consumer
// import doesn't trip on missing properties.
jest.mock('react-native-nitro-avalabs-crypto', () => ({
  signSchnorr: jest.fn(),
  verifySchnorr: jest.fn(),
  getPublicKey: jest.fn(),
  sha256: jest.fn(),
  randomBytes: jest.fn(),
  secp256k1: { sign: jest.fn(), verify: jest.fn() }
}))

import { signSchnorr, verifySchnorr } from 'react-native-nitro-avalabs-crypto'

// BIP-340 official test vector index 0.
export const BIP340_VECTOR_0 = {
  secretKey: '0000000000000000000000000000000000000000000000000000000000000003',
  publicKey: 'f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f9',
  auxRand: '0000000000000000000000000000000000000000000000000000000000000000',
  message: '0000000000000000000000000000000000000000000000000000000000000000',
  expectedSig:
    'e907831f80848d1069a5371b402410364bdf1c5f8307b0084c55f1ce2dca821525f66a4a85ea8b71e482a74f382d2ce5ebeee8fdb2172f477df4900d310536c0'
} as const

const expectedHexLen = (label: string, hex: string, bytes: number): void => {
  if (hex.length !== bytes * 2) {
    throw new Error(
      `${label}: expected ${bytes * 2} hex chars (${bytes} bytes), got ${
        hex.length
      }`
    )
  }
  if (!/^[0-9a-f]+$/.test(hex)) {
    throw new Error(`${label}: must be lowercase hex only`)
  }
}

describe('Schnorr (BIP-340) — vector documentation + mock contract', () => {
  describe('BIP-340 vector 0 byte-length sanity', () => {
    it('secretKey is 32 bytes of lowercase hex', () => {
      expect(() =>
        expectedHexLen('secretKey', BIP340_VECTOR_0.secretKey, 32)
      ).not.toThrow()
    })

    it('publicKey is 32 bytes of lowercase hex (x-only BIP-340 form)', () => {
      expect(() =>
        expectedHexLen('publicKey', BIP340_VECTOR_0.publicKey, 32)
      ).not.toThrow()
    })

    it('message is 32 bytes of lowercase hex', () => {
      expect(() =>
        expectedHexLen('message', BIP340_VECTOR_0.message, 32)
      ).not.toThrow()
    })

    it('auxRand is 32 bytes of lowercase hex', () => {
      expect(() =>
        expectedHexLen('auxRand', BIP340_VECTOR_0.auxRand, 32)
      ).not.toThrow()
    })

    it('expectedSig is 64 bytes of lowercase hex', () => {
      expect(() =>
        expectedHexLen('expectedSig', BIP340_VECTOR_0.expectedSig, 64)
      ).not.toThrow()
    })
  })

  describe('mock contract', () => {
    const mockedSign = signSchnorr as unknown as jest.Mock
    const mockedVerify = verifySchnorr as unknown as jest.Mock

    beforeEach(() => {
      mockedSign.mockReset()
      mockedVerify.mockReset()
    })

    it('signSchnorr is a configurable jest.fn() that returns whatever the test provides', () => {
      const fakeSig = new Uint8Array(64).fill(0xab)
      mockedSign.mockReturnValue(fakeSig)

      const result = signSchnorr(
        BIP340_VECTOR_0.message as unknown as string,
        BIP340_VECTOR_0.secretKey as unknown as string,
        BIP340_VECTOR_0.auxRand as unknown as string
      )

      expect(result).toBe(fakeSig)
      expect(mockedSign).toHaveBeenCalledWith(
        BIP340_VECTOR_0.message,
        BIP340_VECTOR_0.secretKey,
        BIP340_VECTOR_0.auxRand
      )
    })

    it('verifySchnorr is a configurable jest.fn() that returns the boolean the test provides', () => {
      mockedVerify.mockReturnValue(true)
      const ok = verifySchnorr(
        BIP340_VECTOR_0.publicKey as unknown as string,
        BIP340_VECTOR_0.message as unknown as string,
        BIP340_VECTOR_0.expectedSig as unknown as string
      )
      expect(ok).toBe(true)

      mockedVerify.mockReturnValue(false)
      const nope = verifySchnorr(
        BIP340_VECTOR_0.publicKey as unknown as string,
        BIP340_VECTOR_0.message as unknown as string,
        BIP340_VECTOR_0.expectedSig as unknown as string
      )
      expect(nope).toBe(false)

      expect(mockedVerify).toHaveBeenCalledTimes(2)
    })
  })
})
