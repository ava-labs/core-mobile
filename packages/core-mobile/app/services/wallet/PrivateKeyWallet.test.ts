// @ts-nocheck
import { Avalanche } from '@avalabs/core-wallets-sdk'
import NetworkService from 'services/network/NetworkService'
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
})
