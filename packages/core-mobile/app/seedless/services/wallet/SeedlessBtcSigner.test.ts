import { Psbt, Network, payments } from 'bitcoinjs-lib'
import * as cs from '@cubist-labs/cubesigner-sdk'
import { SeedlessBtcSigner } from './SeedlessBtcSigner'

const MOCK_KEY =
  '0x042f8b9c3e7d1f5a6b2e8c4a1f3d7b6e2a9c8b4e1f3d7b6e2a9c8b4e1f3d7d7b6e2a9c8b4e1f3d7d7b6e2a9c8b4e1f3d7d7b6e2a9c8b4e1f3d7d7b6e2a9c8b4e1f3'
const MOCK_BUFFER = [
  4, 47, 139, 156, 62, 125, 31, 90, 107, 46, 140, 74, 31, 61, 123, 110, 42, 156,
  139, 78, 31, 61, 123, 110, 42, 156, 139, 78, 31, 61, 125, 123, 110, 42, 156,
  139, 78, 31, 61, 125, 123, 110, 42, 156, 139, 78, 31, 61, 125, 123, 110, 42,
  156, 139, 78, 31, 61, 125, 123, 110, 42, 156, 139, 78
]

jest.mock('@avalabs/core-wallets-sdk', () => ({
  getBtcAddressFromPubKey: jest.fn(() => 'testAddress')
}))

describe('SeedlessBtcSigner', () => {
  const btcSigner = new SeedlessBtcSigner({
    fromKey: MOCK_KEY,
    // @ts-ignore
    psbt: {
      txInputs: [1],
      txOutputs: [{ value: 'value', script: 'value' }]
    } as Psbt,
    inputIndex: 0,
    utxos: [],
    network: {} as Network,
    // @ts-ignore
    client: {
      apiClient: {
        signBtc: () => {
          return {
            data: () => {
              return { signature: MOCK_KEY }
            }
          }
        }
      }
    } as cs.CubeSignerClient
  })
  it('should have returned Invalid public key error', () => {
    try {
      // @ts-ignore
      const _ = new SeedlessBtcSigner({
        fromKey: 'invalidFromKey',
        psbt: {} as Psbt,
        inputIndex: 0,
        utxos: [],
        network: {} as Network,
        client: {} as cs.CubeSignerClient
      })
    } catch (e) {
      expect((e as Error).message).toBe('Invalid public key')
    }
  })
  it('should have returned the address', () => {
    expect(btcSigner.address).toBe('testAddress')
  })
  it('should have returned the public key', () => {
    const result = btcSigner.getPublicKey()
    expect(result).toEqual(
      Buffer.from([
        3, 47, 139, 156, 62, 125, 31, 90, 107, 46, 140, 74, 31, 61, 123, 110,
        42, 156, 139, 78, 31, 61, 123, 110, 42, 156, 139, 78, 31, 61, 125, 123,
        110
      ])
    )
  })
  it('should have returned error for signSchnorr', () => {
    try {
      btcSigner.signSchnorr
    } catch (e) {
      expect((e as Error).message).toBe('Unsupported: No Schnorr signatures.')
    }
  })

  describe('sign', () => {
    const mockP2pkh = jest.fn()

    beforeEach(() => {
      jest.clearAllMocks()
      jest
        .spyOn(payments, 'p2pkh')
        .mockImplementation(mockP2pkh.mockReturnValue({ output: 'value' }))
    })
    it('should have returned Buffer for sign function', async () => {
      const buffer = await btcSigner.sign()
      expect(buffer).toEqual(Buffer.from(MOCK_BUFFER))
    })
    it('should have returned error Unable to create p2pkh', async () => {
      mockP2pkh.mockReturnValue({ output: undefined })
      try {
        await btcSigner.sign()
      } catch (e) {
        expect((e as Error).message).toBe('Unable to create p2pkh')
      }
    })
    it('should have returned error Unexpected signature length', async () => {
      const signer = new SeedlessBtcSigner({
        fromKey: MOCK_KEY,
        // @ts-ignore
        psbt: {
          txInputs: [1],
          txOutputs: [{ value: 'value', script: 'value' }]
        } as Psbt,
        inputIndex: 0,
        utxos: [],
        network: {} as Network,
        // @ts-ignore
        client: {
          apiClient: {
            signBtc: () => {
              return {
                data: () => {
                  return { signature: 'MOCK_KEY' }
                }
              }
            }
          }
        } as cs.CubeSignerClient
      })
      try {
        await signer.sign()
      } catch (e) {
        expect((e as Error).message).toContain('Unexpected signature length')
      }
    })
  })
})
