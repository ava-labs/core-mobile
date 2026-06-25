import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import { RpcMethod, TypedData, MessageTypes } from '@avalabs/vm-module-types'
import {
  personalSign,
  signTypedData,
  SignTypedDataVersion
} from '@metamask/eth-sig-util'
import { Wallet as EthersWallet } from 'ethers'
import NetworkService from 'services/network/NetworkService'
import WalletFactory from './WalletFactory'
import WalletService from './WalletService'

// CP-14468 defense-in-depth: WalletService must verify that the address recovered
// from a produced EVM signature/transaction matches the account the approval
// prompt referred to. These tests use REAL signing + REAL recovery (no mocked
// recover()), so they also lock in the typed-data version selection and the
// Transaction.from() recovery path.

jest.mock('utils/api/generated/profileApi.client', () => ({
  __esModule: true,
  postV1GetAddresses: jest.fn()
}))
jest.mock('utils/api/clients/profileApiClient', () => ({
  profileApiClient: {}
}))
jest.mock('utils/caip2ChainIds', () => ({
  applyTempChainIdConversion: jest.fn((id: number) => id)
}))
jest.mock('utils/Logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
}))
// Run the span callback directly so we don't depend on Sentry init.
jest.mock('services/sentry/SentryWrapper', () => ({
  __esModule: true,
  default: {
    startSpan: (_opts: unknown, fn: () => unknown) => fn()
  }
}))
jest.mock('services/network/NetworkService', () => ({
  __esModule: true,
  default: { getProviderForNetwork: jest.fn() }
}))

// A provider that passes `instanceof JsonRpcBatchInternal` without real init.
class MockEvmProvider {}
Object.setPrototypeOf(MockEvmProvider.prototype, JsonRpcBatchInternal.prototype)

// Hardhat account #0 — deterministic test key.
const PRIVATE_KEY =
  'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const ethersWallet = new EthersWallet(`0x${PRIVATE_KEY}`)
const SIGNER_ADDRESS = ethersWallet.address // checksummed
const OTHER_ADDRESS = '0x000000000000000000000000000000000000dEaD'
const network = { vmName: 'EVM', chainId: 1 } as never

const TYPED_DATA_V4: TypedData<MessageTypes> = {
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'chainId', type: 'uint256' }
    ],
    Person: [{ name: 'wallet', type: 'address' }]
  },
  primaryType: 'Person',
  domain: { name: 'Test', chainId: 1 },
  message: { wallet: SIGNER_ADDRESS }
}

const signMessageMock = jest.fn()
const signEvmTransactionMock = jest.fn()

const mockWalletWith = (overrides: Record<string, unknown>): void => {
  jest
    .spyOn(WalletFactory, 'createWallet')
    .mockResolvedValue(overrides as never)
}

describe('WalletService EVM signer-recovery verification (real crypto)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(NetworkService.getProviderForNetwork as jest.Mock).mockResolvedValue(
      new MockEvmProvider()
    )
  })

  describe('signMessage', () => {
    it('resolves when the personal_sign signature recovers to fromAddress', async () => {
      const data = '0xdeadbeef'
      const signature = personalSign({
        privateKey: Buffer.from(PRIVATE_KEY, 'hex'),
        data
      })
      signMessageMock.mockResolvedValue(signature)
      mockWalletWith({ signMessage: signMessageMock })

      await expect(
        WalletService.signMessage({
          walletId: 'w1',
          walletType: 'MNEMONIC' as never,
          rpcMethod: RpcMethod.PERSONAL_SIGN,
          data,
          accountIndex: 0,
          network,
          fromAddress: SIGNER_ADDRESS
        })
      ).resolves.toBe(signature)
    })

    it('throws when the personal_sign signature recovers to a different address', async () => {
      const data = '0xdeadbeef'
      const signature = personalSign({
        privateKey: Buffer.from(PRIVATE_KEY, 'hex'),
        data
      })
      signMessageMock.mockResolvedValue(signature)
      mockWalletWith({ signMessage: signMessageMock })

      await expect(
        WalletService.signMessage({
          walletId: 'w1',
          walletType: 'MNEMONIC' as never,
          rpcMethod: RpcMethod.PERSONAL_SIGN,
          data,
          accountIndex: 0,
          network,
          fromAddress: OTHER_ADDRESS
        })
      ).rejects.toThrow('EVM message signer mismatch')
    })

    it('resolves for SIGN_TYPED_DATA_V4 when recovery matches (locks version selection)', async () => {
      const signature = signTypedData({
        privateKey: Buffer.from(PRIVATE_KEY, 'hex'),
        data: TYPED_DATA_V4,
        version: SignTypedDataVersion.V4
      })
      signMessageMock.mockResolvedValue(signature)
      mockWalletWith({ signMessage: signMessageMock })

      await expect(
        WalletService.signMessage({
          walletId: 'w1',
          walletType: 'MNEMONIC' as never,
          rpcMethod: RpcMethod.SIGN_TYPED_DATA_V4,
          data: TYPED_DATA_V4,
          accountIndex: 0,
          network,
          fromAddress: SIGNER_ADDRESS
        })
      ).resolves.toBe(signature)
    })

    it('does not verify non-EVM sign methods (no false positives)', async () => {
      // A bogus signature that could never recover to fromAddress — must be
      // ignored because the method is not an EVM sign method.
      signMessageMock.mockResolvedValue('0xnot-a-real-signature')
      mockWalletWith({ signMessage: signMessageMock })

      await expect(
        WalletService.signMessage({
          walletId: 'w1',
          walletType: 'MNEMONIC' as never,
          rpcMethod: RpcMethod.AVALANCHE_SIGN_MESSAGE,
          data: '0xdeadbeef',
          accountIndex: 0,
          network,
          fromAddress: SIGNER_ADDRESS
        })
      ).resolves.toBe('0xnot-a-real-signature')
    })
  })

  describe('sign (EVM transaction)', () => {
    const buildSignedTx = (): Promise<string> =>
      ethersWallet.signTransaction({
        to: OTHER_ADDRESS,
        value: 0n,
        nonce: 0,
        gasLimit: 21000n,
        maxFeePerGas: 1000000000n,
        maxPriorityFeePerGas: 1000000000n,
        chainId: 1,
        type: 2
      })

    it('resolves when the signed tx recovers to fromAddress', async () => {
      const signedTx = await buildSignedTx()
      signEvmTransactionMock.mockResolvedValue(signedTx)
      mockWalletWith({ signEvmTransaction: signEvmTransactionMock })

      await expect(
        WalletService.sign({
          walletId: 'w1',
          walletType: 'MNEMONIC' as never,
          transaction: { to: OTHER_ADDRESS, value: 0n } as never,
          accountIndex: 0,
          network,
          fromAddress: SIGNER_ADDRESS
        })
      ).resolves.toBe(signedTx)
    })

    it('throws when the signed tx recovers to a different address', async () => {
      const signedTx = await buildSignedTx()
      signEvmTransactionMock.mockResolvedValue(signedTx)
      mockWalletWith({ signEvmTransaction: signEvmTransactionMock })

      await expect(
        WalletService.sign({
          walletId: 'w1',
          walletType: 'MNEMONIC' as never,
          transaction: { to: OTHER_ADDRESS, value: 0n } as never,
          accountIndex: 0,
          network,
          fromAddress: OTHER_ADDRESS
        })
      ).rejects.toThrow('EVM transaction signer mismatch')
    })

    it('does not verify when fromAddress is not provided', async () => {
      const signedTx = await buildSignedTx()
      signEvmTransactionMock.mockResolvedValue(signedTx)
      mockWalletWith({ signEvmTransaction: signEvmTransactionMock })

      await expect(
        WalletService.sign({
          walletId: 'w1',
          walletType: 'MNEMONIC' as never,
          transaction: { to: OTHER_ADDRESS, value: 0n } as never,
          accountIndex: 0,
          network
        })
      ).resolves.toBe(signedTx)
    })
  })
})
