import { AddressPublicKey, Curve, getEvmAccountIndices } from './publicKeys'

const key = (
  derivationPath: string,
  curve = Curve.SECP256K1
): AddressPublicKey => ({
  curve,
  derivationPath,
  key: 'aa'.repeat(32)
})

describe('getEvmAccountIndices', () => {
  it('returns the account index of every EVM key', () => {
    expect(
      getEvmAccountIndices([key("m/44'/60'/0'/0/0"), key("m/44'/60'/0'/0/1")])
    ).toEqual([0, 1])
  })

  it('preserves gaps instead of compacting to a count', () => {
    expect(
      getEvmAccountIndices([key("m/44'/60'/0'/0/0"), key("m/44'/60'/0'/0/2")])
    ).toEqual([0, 2])
  })

  it('ignores Avalanche and Solana keys', () => {
    expect(
      getEvmAccountIndices([
        key("m/44'/60'/0'/0/0"),
        key("m/44'/9000'/0'/0/0"),
        key("m/44'/9000'/0'/0/1"),
        key("m/44'/501'/0'/0'", Curve.ED25519)
      ])
    ).toEqual([0])
  })

  it('returns distinct indices when the same path is stored twice', () => {
    expect(
      getEvmAccountIndices([key("m/44'/60'/0'/0/0"), key("m/44'/60'/0'/0/0")])
    ).toEqual([0])
  })

  it('returns an empty array when there are no EVM keys', () => {
    expect(getEvmAccountIndices([])).toEqual([])
  })
})
