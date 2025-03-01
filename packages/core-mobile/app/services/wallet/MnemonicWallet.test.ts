// @ts-nocheck
import {
  Avalanche,
  BitcoinWallet,
  BitcoinProvider
} from '@avalabs/core-wallets-sdk'
import { BaseWallet } from 'ethers'
import { RpcMethod } from 'store/rpc/types'
import * as ethSignUtil from '@metamask/eth-sig-util'
import MnemonicWallet from './MnemonicWallet'

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

const MOCK_MENMONIC =
  'seed horn heart blood noble total foster paddle welcome mother hospital tilt orphan someone defy blossom mercy execute visit journey layer north horn dinner'
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

jest.spyOn(MnemonicWallet, 'getAvaSigner')
jest.spyOn(MnemonicWallet, 'getEvmSigner')
jest.spyOn(MnemonicWallet, 'getBtcSigner')
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
  beforeEach(() => {
    jest.clearAllMocks()
    MnemonicWallet.mnemonic = MOCK_MENMONIC
  })

  describe('getSigner', () => {
    it('should have returned error invalid mnemonic phrase.', async () => {
      MnemonicWallet.mnemonic = 'MOCK_MENMONIC'
      try {
        await MnemonicWallet.getBtcSigner(0, {})
      } catch (e) {
        expect((e as Error).message).toBe('Invalid mnemonic phrase.')
      }
    })

    it('should have returned bitcoin wallet', async () => {
      const wallet = await MnemonicWallet.getBtcSigner(0, {})
      expect(wallet).toBeInstanceOf(BitcoinWallet)
    })

    it('should have returned base wallet', () => {
      const wallet = MnemonicWallet.getEvmSigner(0, {})
      expect(wallet).toBeInstanceOf(BaseWallet)
    })
    it('should have returned Avalanche.StaticSigner', async () => {
      const wallet = await MnemonicWallet.getAvaSigner(0, {})
      expect(wallet).toBeInstanceOf(Avalanche.StaticSigner)
    })
    it('should have returned Avalanche.SimpleSigner', async () => {
      const wallet = await MnemonicWallet.getAvaSigner(0)
      expect(wallet).toBeInstanceOf(Avalanche.SimpleSigner)
    })
    it('should have called getEvmSigner for EVM network', async () => {
      await MnemonicWallet.getSigner({
        accountIndex: 0,
        network: { vmName: 'EVM' },
        provider: {}
      })
      // @ts-ignore
      expect(MnemonicWallet.getEvmSigner).toHaveBeenCalled()
    })
    it('should have called getBtcSigner for BTC network', async () => {
      await MnemonicWallet.getSigner({
        accountIndex: 0,
        network: { vmName: 'BITCOIN' },
        provider: new BitcoinProvider()
      })
      expect(MnemonicWallet.getBtcSigner).toHaveBeenCalled()
    })
    it('should have thrown error with incorrect provider for BTC network ', async () => {
      try {
        await MnemonicWallet.getSigner({
          accountIndex: 0,
          network: { vmName: 'BITCOIN' },
          provider: {}
        })
      } catch (e) {
        expect((e as Error).message).toBe(
          'Unable to get signer: wrong provider obtained for BTC network'
        )
      }
    })
    it('should have called getAvaSigner for AVM network', async () => {
      await MnemonicWallet.getSigner({
        accountIndex: 0,
        network: { vmName: 'AVM' },
        provider: new Avalanche.JsonRpcProvider('url', MOCK_CONTEXT)
      })
      expect(MnemonicWallet.getAvaSigner).toHaveBeenCalled()
    })
    it('should have thrown error with incorrect provider for AVM network', async () => {
      try {
        await MnemonicWallet.getSigner({
          accountIndex: 0,
          network: { vmName: 'AVM' },
          provider: {}
        })
      } catch (e) {
        expect((e as Error).message).toBe(
          'Unable to get signer: wrong provider obtained for network AVM'
        )
      }
    })
    it('should have thrown error with incorrect provider for PVM network', async () => {
      try {
        await MnemonicWallet.getSigner({
          accountIndex: 0,
          network: { vmName: 'PVM' },
          provider: {}
        })
      } catch (e) {
        expect((e as Error).message).toBe(
          'Unable to get signer: wrong provider obtained for network PVM'
        )
      }
    })
    it('should have thrown error with unsupported network', async () => {
      try {
        await MnemonicWallet.getSigner({
          accountIndex: 0,
          network: { vmName: 'UNSUPPORTED' },
          provider: {}
        })
      } catch (e) {
        expect((e as Error).message).toBe(
          'Unable to get signer: network not supported'
        )
      }
    })
  })

  describe('signMessage', () => {
    const signMessage = async ({
      data = undefined,
      rpcMethod = RpcMethod.ETH_SIGN
    }: {
      data?: unknown
      rpcMethod?: RpcMethod
    }) => {
      return MnemonicWallet.signMessage({
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
      const signedTx = await MnemonicWallet.signAvalancheTransaction({
        accountIndex: 0,
        transaction: {},
        network: { vmName: 'AVM' },
        provider: new Avalanche.JsonRpcProvider('url', MOCK_CONTEXT)
      })
      expect(signedTx).toBe('{"signedTx":"signedTx"}')
    })
    it('should have returned signed tx with btc signer', async () => {
      const signedTx = await MnemonicWallet.signBtcTransaction({
        accountIndex: 0,
        transaction: {},
        network: { vmName: 'BITCOIN' },
        provider: new BitcoinProvider()
      })
      expect(signedTx).toBe('signedTx')
    })
    it('should have returned signed tx with evm signer', async () => {
      const signedTx = await MnemonicWallet.signEvmTransaction({
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
      MnemonicWallet.mnemonic = MOCK_MENMONIC
      expect(MnemonicWallet.mnemonic).toBe(MOCK_MENMONIC)
    })
    it('should have returned error no mnemonic available', () => {
      MnemonicWallet.mnemonic = undefined
      try {
        MnemonicWallet.mnemonic
      } catch (e) {
        expect((e as Error).message).toBe('no mnemonic available')
      }
    })
  })
  describe('xpub', () => {
    it('should have returned xpub', () => {
      MnemonicWallet.xpub = MOCK_XPUB
      expect(MnemonicWallet.xpub).toBe(MOCK_XPUB)
    })
    it('should have returned error no public key (xpub) available', () => {
      MnemonicWallet.xpub = undefined
      try {
        MnemonicWallet.xpub
      } catch (e) {
        expect((e as Error).message).toBe('no public key (xpub) available')
      }
    })
  })
  describe('xpubXP', () => {
    it('should have returned xpubXP', () => {
      MnemonicWallet.xpubXP = MOCK_XPUBXP
      expect(MnemonicWallet.xpubXP).toBe(MOCK_XPUBXP)
    })
    it('should have returned error no public key (xpubXP) available', () => {
      MnemonicWallet.xpubXP = undefined
      try {
        MnemonicWallet.xpubXP
      } catch (e) {
        expect((e as Error).message).toBe('no public key (xpubXP) available')
      }
    })
  })
})
