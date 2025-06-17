// @ts-nocheck
import {
  Avalanche,
  BitcoinWallet,
  BitcoinProvider
} from '@avalabs/core-wallets-sdk'
import { BaseWallet } from 'ethers'
import { RpcMethod } from 'store/rpc/types'
import * as ethSignUtil from '@metamask/eth-sig-util'
import mockMnemonic from 'tests/fixtures/mockMnemonic.json'
import { MnemonicWallet } from './MnemonicWallet'

const TYPED_DATA = {
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' }
    ],
    Group: [
      { name: 'name', type: 'string' },
      { name: 'members', type: 'Person[]' }
    ],
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person[]' },
      { name: 'contents', type: 'string' }
    ],
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallets', type: 'address[]' }
    ]
  },
  primaryType: 'Mail',
  domain: {
    chainId: 43113,
    name: 'Ether Mail',
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
    version: '1'
  },
  message: {
    contents: 'Hello, Bob!',
    from: {
      name: 'Cow',
      wallets: [
        '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
        '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF'
      ]
    },
    to: [
      {
        name: 'Bob',
        wallets: [
          '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
          '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
          '0xB0B0b0b0b0b0B000000000000000000000000000'
        ]
      }
    ]
  }
}

const MOCK_MENMONIC = mockMnemonic.value
const MOCK_XPUB = 'MOCK_XPUB'
const MOCK_XPUBXP = 'MOCK_XPUBXP'
const MOCK_CONTEXT = {
  networkID: 1,
  hrp: 'hrp',
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

jest.mock('@metamask/eth-sig-util', () => ({
  ...jest.requireActual('@metamask/eth-sig-util'),
  personalSign: jest.fn(),
  signTypedData: jest.fn()
}))

jest
  .spyOn(Avalanche.AbstractProvider.prototype, 'getInfo')
  .mockImplementation(() => {
    return {
      getUpgradesInfo: jest.fn()
    }
  })

describe('MnemonicWallet', () => {
  let mnemonicWallet: MnemonicWallet

  beforeEach(async () => {
    jest.clearAllMocks()
    mnemonicWallet = new MnemonicWallet()
    await mnemonicWallet.initialize(MOCK_MENMONIC)
  })

  describe('getSigner', () => {
    it('should have returned error invalid mnemonic phrase.', async () => {
      const invalidWallet = new MnemonicWallet()
      try {
        await invalidWallet.initialize('MOCK_MENMONIC')
      } catch (e) {
        expect((e as Error).message).toContain('Invalid mnemonic phrase.')
      }
    })

    it('should sign BTC transaction successfully', async () => {
      const result = await mnemonicWallet.signBtcTransaction({
        accountIndex: 0,
        transaction: { inputs: [], outputs: [] },
        network: { vmName: 'BITCOIN' },
        provider: new BitcoinProvider()
      })
      expect(typeof result).toBe('string')
    })

    it('should sign EVM transaction successfully', async () => {
      const result = await mnemonicWallet.signEvmTransaction({
        accountIndex: 0,
        transaction: {},
        network: { vmName: 'EVM' },
        provider: {}
      })
      expect(typeof result).toBe('string')
    })

    // it('should get addresses successfully', async () => {
    //   const addresses = await mnemonicWallet.getAddresses({
    //     accountIndex: 0,
    //     provXP: new Avalanche.JsonRpcProvider('url', MOCK_CONTEXT),
    //     network: { vmName: 'AVM' }
    //   })
    //   expect(addresses).toHaveProperty('EVM')
    //   expect(addresses).toHaveProperty('AVM')
    //   expect(addresses).toHaveProperty('PVM')
    // })
  })

  describe('signMessage', () => {
    const signMessage = async ({
      data = undefined,
      rpcMethod = RpcMethod.ETH_SIGN
    }: {
      data?: unknown
      rpcMethod?: RpcMethod
    }) => {
      return mnemonicWallet.signMessage({
        rpcMethod,
        data,
        accountIndex: 0,
        network: { vmName: 'EVM' },
        provider: {}
      })
    }
    it('should have returned error data must be string', async () => {
      try {
        await signMessage({})
      } catch (e) {
        expect((e as Error).message).toBe('data must be string')
      }
    })
    it('should have called personalSign', async () => {
      await signMessage({ data: 'test' })
      expect(ethSignUtil.personalSign).toHaveBeenCalled()
    })
    it('should have called signTypedData with version V1', async () => {
      await signMessage({
        data: [{ name: 'test', type: 'string', value: 'test' }],
        rpcMethod: RpcMethod.SIGN_TYPED_DATA_V1
      })
      expect(ethSignUtil.signTypedData).toHaveBeenCalledWith({
        data: [{ name: 'test', type: 'string', value: 'test' }],
        version: 'V1',
        privateKey: expect.any(Buffer)
      })
    })

    it('should have called signTypedData with version V4', async () => {
      await signMessage({
        data: TYPED_DATA,
        rpcMethod: RpcMethod.SIGN_TYPED_DATA_V1
      })
      expect(ethSignUtil.signTypedData).toHaveBeenCalledWith({
        data: TYPED_DATA,
        version: 'V4',
        privateKey: expect.any(Buffer)
      })
    })
    it('should have called signTypedData with version V3', async () => {
      await signMessage({
        data: TYPED_DATA,
        rpcMethod: RpcMethod.SIGN_TYPED_DATA_V3
      })
      expect(ethSignUtil.signTypedData).toHaveBeenCalledWith({
        data: TYPED_DATA,
        version: 'V3',
        privateKey: expect.any(Buffer)
      })
    })
    it('should have thrown error with unknown RPC method', async () => {
      try {
        await signMessage({
          data: {},
          rpcMethod: 'unknown' as RpcMethod
        })
      } catch (e) {
        expect((e as Error).message).toBe('unknown method')
      }
    })
  })

  describe('signTransaction', () => {
    jest.spyOn(BitcoinWallet.prototype, 'signTx').mockImplementation(() => {
      return { toHex: () => 'signedTx' }
    })
    jest
      .spyOn(Avalanche.SimpleSigner.prototype, 'signTx')
      .mockImplementation(() => {
        return {
          toJSON: () => {
            return { signedTx: 'signedTx' }
          }
        }
      })
    jest
      .spyOn(Avalanche.StaticSigner.prototype, 'signTx')
      .mockImplementation(() => {
        return {
          toJSON: () => {
            return { signedTx: 'signedTx' }
          }
        }
      })
    jest
      .spyOn(BaseWallet.prototype, 'signTransaction')
      .mockImplementation(() => {
        return 'signedTx'
      })
    it('should have returned signed tx with avalanche signer', async () => {
      const signedTx = await mnemonicWallet.signAvalancheTransaction({
        accountIndex: 0,
        transaction: {},
        network: { vmName: 'AVM' },
        provider: new Avalanche.JsonRpcProvider('url', MOCK_CONTEXT)
      })
      expect(signedTx).toBe('{"signedTx":"signedTx"}')
    })
    it('should have returned signed tx with btc signer', async () => {
      const signedTx = await mnemonicWallet.signBtcTransaction({
        accountIndex: 0,
        transaction: {},
        network: { vmName: 'BITCOIN' },
        provider: new BitcoinProvider()
      })
      expect(signedTx).toBe('signedTx')
    })
    it('should have returned signed tx with evm signer', async () => {
      const signedTx = await mnemonicWallet.signEvmTransaction({
        accountIndex: 0,
        transaction: {},
        network: { vmName: 'EVM' },
        provider: {} as BaseWallet
      })
      expect(signedTx).toBe('signedTx')
    })
  })

  describe('mnemonic', () => {
    it('should have returned mnemonic', () => {
      expect(mnemonicWallet.mnemonic).toBe(MOCK_MENMONIC)
    })
    it('should have returned error no mnemonic available', () => {
      mnemonicWallet.mnemonic = undefined
      try {
        mnemonicWallet.mnemonic
      } catch (e) {
        expect((e as Error).message).toBe('no mnemonic available')
      }
    })
  })
  describe('xpub', () => {
    it('should have returned xpub', () => {
      mnemonicWallet.xpub = MOCK_XPUB
      expect(mnemonicWallet.xpub).toBe(MOCK_XPUB)
    })
    it('should have returned error no public key (xpub) available', () => {
      mnemonicWallet.xpub = undefined
      try {
        mnemonicWallet.xpub
      } catch (e) {
        expect((e as Error).message).toBe('no public key (xpub) available')
      }
    })
  })
  describe('xpubXP', () => {
    it('should have returned xpubXP', () => {
      mnemonicWallet.xpubXP = MOCK_XPUBXP
      expect(mnemonicWallet.xpubXP).toBe(MOCK_XPUBXP)
    })
    it('should have returned error no public key (xpubXP) available', () => {
      mnemonicWallet.xpubXP = undefined
      try {
        mnemonicWallet.xpubXP
      } catch (e) {
        expect((e as Error).message).toBe('no public key (xpubXP) available')
      }
    })
  })
})
