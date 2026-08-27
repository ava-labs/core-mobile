// @ts-nocheck
import {
  Avalanche,
  JsonRpcBatchInternal,
  SolanaSigner
} from '@avalabs/core-wallets-sdk'
import { deriveAddressesForSvm } from '@avalabs/crypto-sdk'
import NetworkService from 'services/network/NetworkService'
import { RpcMethod } from '@avalabs/vm-module-types'
import { PrivateKeyWallet } from './PrivateKeyWallet'

const MOCK_PRIVATE_KEY =
  '0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318'

const MOCK_CONTEXT = {
  networkID: 1,
  hrp: 'avax',
  xBlockchainID: 'xBlockchainID',
  pBlockchainID: 'pBlockchainID',
  cBlockchainID: 'cBlockchainID',
  avaxAssetID: 'avaxAssetID',
  baseTxFee: BigInt(1),
  createAssetTxFee: BigInt(1),
  createSubnetTxFee: BigInt(1),
  transformSubnetTxFee: BigInt(1),
  createBlockchainTxFee: BigInt(1),
  addPrimaryNetworkValidatorFee: BigInt(1),
  addPrimaryNetworkDelegatorFee: BigInt(1),
  addSubnetValidatorFee: BigInt(1),
  addSubnetDelegatorFee: BigInt(1)
}

jest.mock('services/network/NetworkService', () => ({
  __esModule: true,
  default: {
    getAvalancheProviderXP: jest.fn()
  }
}))

describe('PrivateKeyWallet', () => {
  let wallet: PrivateKeyWallet
  let provXP: Avalanche.JsonRpcProvider

  beforeEach(() => {
    wallet = new PrivateKeyWallet(MOCK_PRIVATE_KEY)
    provXP = new Avalanche.JsonRpcProvider('http://example.test', MOCK_CONTEXT)
    ;(NetworkService.getAvalancheProviderXP as jest.Mock).mockResolvedValue(
      provXP
    )

    jest
      .spyOn(Avalanche.StaticSigner.prototype, 'signTx')
      .mockImplementation(() => ({
        toJSON: () => ({ signedTx: 'signedTx' })
      }))
    jest
      .spyOn(Avalanche.StaticSigner.prototype, 'signMessage')
      .mockImplementation(() => Buffer.from([0x01, 0x02, 0x03]))
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('signAvalancheTransaction', () => {
    it('signs a P-chain transaction with an imported private key', async () => {
      const signedTx = await wallet.signAvalancheTransaction({
        accountIndex: 0,
        transaction: { tx: {}, externalIndices: [], internalIndices: [] },
        network: { vmName: 'PVM', isTestnet: false },
        provider: provXP
      })

      expect(signedTx).toBe('{"signedTx":"signedTx"}')
    })
  })

  describe('signAvalancheMessage', () => {
    it('signs a P-chain message with an imported private key', async () => {
      const result = await wallet.signMessage({
        rpcMethod: RpcMethod.AVALANCHE_SIGN_MESSAGE,
        data: '0x68656c6c6f',
        accountIndex: 0,
        network: { vmName: 'PVM', isTestnet: false, chainId: 1 },
        provider: {} as JsonRpcBatchInternal
      })

      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
      expect(NetworkService.getAvalancheProviderXP).toHaveBeenCalledWith(false)
    })
  })

  // An imported private key backs exactly one Solana address, so the signer must refuse a request naming any other account.
  describe('signSvmTransaction', () => {
    const DERIVED_SVM_ADDRESS = 'HAgk14JCTHbF7CnKMz1PBpJqPuUfmYSDsgLQXzHcxLDT'
    const OTHER_SVM_ADDRESS = 'oeYf6KAJkVELrMEHzFmyRVrTvJgnZzXrLzPTaKp3Vzp'

    beforeEach(() => {
      deriveAddressesForSvm.mockResolvedValue([DERIVED_SVM_ADDRESS])
      jest
        .spyOn(SolanaSigner.prototype, 'signTx')
        .mockResolvedValue('mockedSignedTx')
    })

    it('signs when the request names the wallet own Solana address', async () => {
      const result = await wallet.signSvmTransaction({
        accountIndex: 0,
        transaction: {
          account: DERIVED_SVM_ADDRESS,
          serializedTx: 'anyTransaction'
        },
        network: { vmName: 'SVM' },
        provider: {}
      })

      expect(result).toBe('mockedSignedTx')
    })

    it('refuses to sign for a different account', async () => {
      await expect(
        wallet.signSvmTransaction({
          accountIndex: 0,
          transaction: {
            account: OTHER_SVM_ADDRESS,
            serializedTx: 'anyTransaction'
          },
          network: { vmName: 'SVM' },
          provider: {}
        })
      ).rejects.toThrow('Solana transaction signer mismatch')
      expect(SolanaSigner.prototype.signTx).not.toHaveBeenCalled()
    })

    it('refuses to sign when the request carries no account address', async () => {
      await expect(
        wallet.signSvmTransaction({
          accountIndex: 0,
          transaction: { serializedTx: 'anyTransaction' },
          network: { vmName: 'SVM' },
          provider: {}
        })
      ).rejects.toThrow('Solana transaction signer verification failed')
      expect(SolanaSigner.prototype.signTx).not.toHaveBeenCalled()
    })
  })
})
