// @ts-nocheck
import { Avalanche, BitcoinWallet, BitcoinProvider } from '@avalabs/wallets-sdk'
import { BaseWallet } from 'ethers'
import { RpcMethod } from 'store/walletConnectV2'
import * as ethSignUtil from '@metamask/eth-sig-util'
import MnemonicWallet from './MnemonicWallet'

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
    it('should have returned Avalanche.StaticSigner', () => {
      const wallet = MnemonicWallet.getAvaSigner(0, {})
      expect(wallet).toBeInstanceOf(Avalanche.StaticSigner)
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
    it('should have returned error no message to sign', async () => {
      try {
        await signMessage({})
      } catch (e) {
        expect((e as Error).message).toBe('no message to sign')
      }
    })
    it('should have called personalSign', async () => {
      await signMessage({ data: 'test' })
      expect(ethSignUtil.personalSign).toHaveBeenCalled()
    })
    it('should have called signTypedData with version V1', async () => {
      await signMessage({
        data: 'test',
        rpcMethod: RpcMethod.SIGN_TYPED_DATA_V1
      })
      expect(ethSignUtil.signTypedData).toHaveBeenCalledWith({
        data: 'test',
        version: 'V1',
        privateKey: expect.any(Buffer)
      })
    })

    it('should have called signTypedData with version V4', async () => {
      await signMessage({
        data: { primaryType: 'test', types: {} },
        rpcMethod: RpcMethod.SIGN_TYPED_DATA_V1
      })
      expect(ethSignUtil.signTypedData).toHaveBeenCalledWith({
        data: { primaryType: 'test', types: {} },
        version: 'V4',
        privateKey: expect.any(Buffer)
      })
      await signMessage({
        data: { primaryType: 'test', types: {} },
        rpcMethod: RpcMethod.SIGN_TYPED_DATA_V4
      })
      expect(ethSignUtil.signTypedData).toHaveBeenCalledWith({
        data: { primaryType: 'test', types: {} },
        version: 'V4',
        privateKey: expect.any(Buffer)
      })
    })
    it('should have called signTypedData with version V3', async () => {
      await signMessage({
        data: { primaryType: 'test', types: {} },
        rpcMethod: RpcMethod.SIGN_TYPED_DATA_V3
      })
      expect(ethSignUtil.signTypedData).toHaveBeenCalledWith({
        data: { primaryType: 'test', types: {} },
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
