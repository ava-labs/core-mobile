/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import {
  Avalanche,
  BitcoinProviderAbstract,
  DerivationPath,
  JsonRpcBatchInternal
} from '@avalabs/core-wallets-sdk'
import { RpcMethod } from '@avalabs/vm-module-types'
import { Curve } from 'utils/publicKeys'
import {
  LedgerAddressType,
  LedgerAppType,
  LedgerDerivationPathType,
  PerAccountPublicKeys
} from 'services/ledger/types'

// Mock dependencies
jest.mock(
  'utils/api/generated/profileApi.client',
  () => ({
    postV1GetAddresses: jest.fn()
  }),
  { virtual: true }
)
jest.mock(
  'utils/api/clients/profileApiClient',
  () => ({
    profileApiClient: {}
  }),
  { virtual: true }
)

// Mock LedgerService - the default export is the service instance
// We need to create the mock inline so Jest can hoist it properly
jest.mock('services/ledger/LedgerService', () => {
  const mockSession = {
    dmk: {
      sendApdu: jest.fn(),
      sendCommand: jest.fn(),
      executeDeviceAction: jest.fn(),
      getDeviceSessionState: jest.fn()
    },
    sessionId: 'test-session-id'
  }
  return {
    __esModule: true,
    default: {
      openApp: jest.fn().mockResolvedValue(undefined),
      ensureConnection: jest.fn().mockResolvedValue(mockSession),
      connect: jest.fn().mockResolvedValue(undefined),
      waitForApp: jest.fn().mockResolvedValue(undefined),
      isConnected: jest.fn().mockReturnValue(true),
      getCurrentAppType: jest.fn().mockReturnValue('AVALANCHE'),
      getAllAddresses: jest.fn(),
      getExtendedPublicKeys: jest.fn()
    }
  }
})

// Mock AppAvax from hw-app-avalanche - defined before jest.mock for hoisting
const mockSign = jest.fn()
const mockSignMsg = jest.fn()
const mockGetETHAddress = jest.fn()
const mockSignEVMTransaction = jest.fn()
const mockAvaxSignEIP712Message = jest.fn()
const mockAvaxSignEIP712HashedMessage = jest.fn()

jest.mock('@avalabs/hw-app-avalanche', () => {
  // Create mock class inside the factory function
  return {
    __esModule: true,
    default: class MockAvalancheApp {
      sign = mockSign
      signMsg = mockSignMsg
      getETHAddress = mockGetETHAddress
      signEVMTransaction = mockSignEVMTransaction
      signEIP712Message = mockAvaxSignEIP712Message
      signEIP712HashedMessage = mockAvaxSignEIP712HashedMessage
      constructor(_transport: unknown) {
        // Constructor accepts transport but doesn't use it
      }
    }
  }
})

// Mock Ethereum app

// @ledgerhq/hw-app-eth left the tree with the Device Management Kit
// migration; LedgerWallet drives the kit's Ethereum signer instead, so there is
// nothing to mock here any more.

// Mock Bitcoin app
// ledger-bitcoin left the tree with the Device Management Kit migration;
// LedgerWallet uses @ledgerhq/device-signer-kit-bitcoin's SignerBtcBuilder now.
// Every call has to carry skipOpenApp, so the kit's own device actions are
// mocked here to let the tests assert the options each one receives.
jest.mock('@ledgerhq/device-signer-kit-bitcoin', () => {
  const { of } = jest.requireActual('rxjs')
  const completed = (output: unknown) => ({
    observable: of({ status: 'pending' }, { status: 'completed', output })
  })

  const getMasterFingerprint = jest
    .fn()
    .mockReturnValue(
      completed({ masterFingerprint: Buffer.from('0badc0de', 'hex') })
    )
  const getExtendedPublicKey = jest
    .fn()
    .mockReturnValue(completed({ extendedPublicKey: 'xpub-from-device' }))
  const registerWallet = jest
    .fn()
    .mockReturnValue(
      completed({ name: 'Core - Account 1', hmac: new Uint8Array(32) })
    )

  return {
    // createWalletPolicy (real SDK code) constructs the kit's WalletPolicy, so
    // only the builder is replaced.
    ...jest.requireActual('@ledgerhq/device-signer-kit-bitcoin'),
    SignerBtcBuilder: jest.fn().mockImplementation(() => ({
      build: () => ({
        getMasterFingerprint,
        getExtendedPublicKey,
        registerWallet
      })
    })),
    __mocks: { getMasterFingerprint, getExtendedPublicKey, registerWallet }
  }
})

// Mock BitcoinWalletPolicyService
jest.mock('./BitcoinWalletPolicyService', () => ({
  BitcoinWalletPolicyService: {
    getEvmPublicKey: jest.fn(),
    findBtcWalletPolicyInPublicKeys: jest.fn(),
    parseWalletPolicyDetailsFromPublicKey: jest.fn(),
    needsBtcWalletPolicyRegistration: jest.fn(),
    storeBtcWalletPolicy: jest.fn()
  }
}))

// Mock BiometricsSDK
jest.mock('utils/BiometricsSDK', () => ({
  __esModule: true,
  default: {
    loadWalletSecret: jest.fn()
  }
}))

// Mock bip32
jest.mock('utils/bip32', () => ({
  bip32: {
    fromBase58: jest.fn(),
    fromPublicKey: jest.fn()
  },
  extendedPublicKeyToXpub: jest.fn().mockReturnValue('xpub-mock')
}))

// Mock providerUtils
jest.mock('services/network/utils/providerUtils', () => ({
  getBitcoinProvider: jest.fn()
}))

// Mock BitcoinLedgerWallet
// LedgerWallet delegates signing to the SDK's signers; these mocks let the
// tests assert the delegation (construction args + call args) rather than
// re-testing derivation-path logic that now lives inside the SDK.
// The fns are created inside the factory — it runs before module-scope consts
// are initialised — and handed back on `__mocks` for the tests to grab.
jest.mock('@avalabs/core-wallets-sdk', () => {
  const actual = jest.requireActual('@avalabs/core-wallets-sdk')

  const avaSignTx = jest.fn()
  const avaSignMessage = jest.fn()
  const evmSignTransaction = jest.fn()
  const evmSignMessage = jest.fn()
  const evmSignTypedData = jest.fn()

  return {
    ...actual,
    BitcoinLedgerWallet: jest.fn().mockImplementation(() => ({
      signTx: jest.fn()
    })),
    LedgerSigner: jest.fn(() => ({
      signTransaction: evmSignTransaction,
      signMessage: evmSignMessage,
      signTypedData: evmSignTypedData
    })),
    Avalanche: {
      ...actual.Avalanche,
      SimpleLedgerSigner: jest.fn(() => ({
        signTx: avaSignTx,
        signMessage: avaSignMessage
      }))
    },
    __mocks: {
      avaSignTx,
      avaSignMessage,
      evmSignTransaction,
      evmSignMessage,
      evmSignTypedData
    }
  }
})

// Import after mocking. App selection (Avalanche vs Ethereum) is driven by the
// real getLedgerAppName(network) helper, so tests control it via the network
// object they pass rather than by mocking a predicate.
import LedgerService from 'services/ledger/LedgerService'
import { bip32 } from 'utils/bip32'
import { getBitcoinProvider } from 'services/network/utils/providerUtils'
import { AvalancheTransactionRequest } from './types'
import { LedgerWallet } from './LedgerWallet'
import { BitcoinWalletPolicyService } from './BitcoinWalletPolicyService'

// Get references to the mocked functions
const sdkMock = jest.requireMock('@avalabs/core-wallets-sdk') as {
  LedgerSigner: jest.Mock
  Avalanche: { SimpleLedgerSigner: jest.Mock }
  __mocks: {
    avaSignTx: jest.Mock
    avaSignMessage: jest.Mock
    evmSignTransaction: jest.Mock
    evmSignMessage: jest.Mock
    evmSignTypedData: jest.Mock
  }
}
const mockSimpleLedgerSigner = sdkMock.Avalanche.SimpleLedgerSigner
const mockLedgerSigner = sdkMock.LedgerSigner
const {
  avaSignTx: mockAvaSignTx,
  avaSignMessage: mockAvaSignMessage,
  evmSignTransaction: mockEvmSignTransaction,
  evmSignMessage: mockEvmSignMessage,
  evmSignTypedData: mockEvmSignTypedData
} = sdkMock.__mocks

const btcKitMock = jest.requireMock('@ledgerhq/device-signer-kit-bitcoin') as {
  __mocks: {
    getMasterFingerprint: jest.Mock
    getExtendedPublicKey: jest.Mock
    registerWallet: jest.Mock
  }
}
const {
  getMasterFingerprint: mockGetMasterFingerprint,
  getExtendedPublicKey: mockGetDeviceExtendedPublicKey,
  registerWallet: mockRegisterWallet
} = btcKitMock.__mocks

const mockOpenApp = LedgerService.openApp as jest.Mock
const mockEnsureConnection = LedgerService.ensureConnection as jest.Mock
const mockWaitForApp = LedgerService.waitForApp as jest.Mock
const mockIsConnected = LedgerService.isConnected as jest.Mock
const mockGetCurrentAppType = LedgerService.getCurrentAppType as jest.Mock
const mockGetAllAddresses = LedgerService.getAllAddresses as jest.Mock
const mockGetExtendedPublicKeys =
  LedgerService.getExtendedPublicKeys as jest.Mock

// Mock DMK session — what LedgerService.ensureConnection() now hands back
class MockSession {
  dmk = {
    sendApdu: jest.fn(),
    sendCommand: jest.fn(),
    executeDeviceAction: jest.fn(),
    getDeviceSessionState: jest.fn()
  }
  sessionId = 'test-session-id'
}

// Helper functions to create mock transactions
const createXChainTx = () => ({
  getVM: jest.fn().mockReturnValue('AVM'),
  toBytes: jest.fn().mockReturnValue(new Uint8Array()),
  addSignature: jest.fn(),
  toJSON: jest.fn().mockReturnValue({})
})

describe('LedgerWallet', () => {
  let ledgerWallet: LedgerWallet
  const mockDeviceId = 'test-device-id'
  const mockWalletId = 'test-wallet-id'
  const mockPublicKeys: PerAccountPublicKeys = {
    0: [
      {
        key: 'mock-public-key',
        derivationPath: "m/44'/60'/0'/0/0",
        curve: Curve.SECP256K1
      }
    ]
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Reset and configure mocks with default behavior
    mockOpenApp.mockResolvedValue(undefined)
    mockEnsureConnection.mockResolvedValue(new MockSession() as never)
    mockWaitForApp.mockResolvedValue(undefined)
    mockIsConnected.mockReturnValue(true)
    mockGetCurrentAppType.mockReturnValue('AVALANCHE')
    mockGetAllAddresses.mockResolvedValue([])
    mockGetExtendedPublicKeys.mockResolvedValue({
      evm: { key: '02'.repeat(33), chainCode: '03'.repeat(32) },
      avalanche: { key: '04'.repeat(33), chainCode: '05'.repeat(32) }
    })
    ;(bip32.fromPublicKey as jest.Mock).mockReturnValue({
      toBase58: jest.fn().mockReturnValue('mock-xpub')
    })

    // Create wallet instance with correct constructor signature
    ledgerWallet = new LedgerWallet({
      deviceId: mockDeviceId,
      derivationPathSpec: LedgerDerivationPathType.BIP44,
      publicKeys: mockPublicKeys,
      walletId: mockWalletId,
      extendedPublicKeys: {
        0: {
          evm: 'mock-evm-xpub',
          avalanche: 'mock-avax-xpub'
        }
      }
    })

    // Mock successful signing by default
    mockSign.mockResolvedValue({
      signatures: new Map()
    })
    mockAvaSignTx.mockResolvedValue({
      toJSON: () => ({ signed: true })
    })
    mockEvmSignTransaction.mockResolvedValue('0xsignedtx')
    mockAvaSignMessage.mockResolvedValue(Buffer.from('cafe', 'hex'))

    // Spy on getTransport to return the mock DMK session
    jest
      .spyOn(ledgerWallet as never, 'getTransport')
      .mockResolvedValue(new MockSession() as never)
  })

  describe('signAvalancheTransaction', () => {
    const mockNetwork = { vmName: 'AVM', isTestnet: false } as Network
    const mockProvider = {} as Avalanche.JsonRpcProvider

    const request = (): AvalancheTransactionRequest =>
      ({
        tx: createXChainTx() as unknown as AvalancheTransactionRequest['tx'],
        externalIndices: [0],
        internalIndices: [1]
      } as unknown as AvalancheTransactionRequest)

    const sign = (accountIndex = 0, transaction = request()): Promise<string> =>
      ledgerWallet.signAvalancheTransaction({
        accountIndex,
        transaction,
        network: mockNetwork,
        provider: mockProvider
      })

    // Chain aliases, derivation paths and index -> signing-path mapping are
    // the SDK signer's job now. What LedgerWallet still owns is the handoff:
    // building the signer correctly and passing the session through.
    describe('delegation to the SDK signer', () => {
      it('builds the signer from the account index, provider and derivation spec', async () => {
        await sign(0)

        expect(mockSimpleLedgerSigner).toHaveBeenCalledWith(
          0,
          mockProvider,
          // The xpub argument is undefined: signAvalancheTransaction asks
          // getExtendedPublicKeyFor for NetworkVMType.PVM, and getKeyForVmType
          // only maps EVM and AVM, so PVM falls through to null. Pre-existing
          // (unchanged since before the DMK migration) — asserted here so the
          // gap is visible rather than silently encoded as `expect.anything()`.
          undefined,
          DerivationPath.BIP44
        )
      })

      it('hands the transaction and the DMK session to the signer', async () => {
        const transaction = request()
        await sign(0, transaction)

        expect(mockAvaSignTx).toHaveBeenCalledWith(
          expect.objectContaining({
            tx: transaction.tx,
            externalIndices: [0],
            internalIndices: [1],
            sessionId: 'test-session-id',
            dmk: expect.any(Object)
          })
        )
      })

      it('returns the signed transaction as JSON', async () => {
        mockAvaSignTx.mockResolvedValue({ toJSON: () => ({ signed: true }) })

        await expect(sign()).resolves.toBe(JSON.stringify({ signed: true }))
      })
    })

    describe('Ledger service integration', () => {
      it('opens the Avalanche app before signing', async () => {
        await sign()
        expect(mockOpenApp).toHaveBeenCalledWith(LedgerAppType.AVALANCHE)
      })

      it('waits for the Avalanche app before signing', async () => {
        await sign()
        expect(mockWaitForApp).toHaveBeenCalledWith(
          LedgerAppType.AVALANCHE,
          expect.any(Number)
        )
      })

      it('ensures the connection before signing', async () => {
        await sign()
        expect(mockEnsureConnection).toHaveBeenCalled()
      })
    })

    describe('error handling', () => {
      it('throws when the connection fails', async () => {
        mockEnsureConnection.mockRejectedValue(new Error('Connection failed'))

        await expect(sign()).rejects.toThrow()
        expect(mockAvaSignTx).not.toHaveBeenCalled()
      })

      it('throws when the Avalanche app is not ready', async () => {
        mockWaitForApp.mockRejectedValue(new Error('App not ready'))

        await expect(sign()).rejects.toThrow()
        expect(mockAvaSignTx).not.toHaveBeenCalled()
      })

      it('throws when signing fails', async () => {
        mockAvaSignTx.mockRejectedValue(new Error('Signing failed'))

        await expect(sign()).rejects.toThrow()
      })
    })
  })

  describe('addAccount', () => {
    it('should persist the device-derived Avalanche C address as addressCoreEth', async () => {
      mockGetAllAddresses.mockResolvedValue([
        {
          id: `${LedgerAddressType.EVM}-0`,
          type: LedgerAddressType.EVM,
          address: '0x1234'
        },
        {
          id: `${LedgerAddressType.AVALANCHE_X}-0`,
          type: LedgerAddressType.AVALANCHE_X,
          address: 'X-fuji1xaddress'
        },
        {
          id: `${LedgerAddressType.AVALANCHE_P}-0`,
          type: LedgerAddressType.AVALANCHE_P,
          address: 'P-fuji1paddress'
        },
        {
          id: `${LedgerAddressType.AVALANCHE_CORE_ETH}-0`,
          type: LedgerAddressType.AVALANCHE_CORE_ETH,
          address: 'C-fuji1correctatomic'
        },
        {
          id: `${LedgerAddressType.BITCOIN}-0`,
          type: LedgerAddressType.BITCOIN,
          address: 'bc1qbtcaddress'
        }
      ])

      const result = await ledgerWallet.addAccount({
        index: 0,
        isTestnet: true,
        walletId: mockWalletId,
        name: 'Ledger 1'
      })

      expect(result.account.addressCoreEth).toBe('C-fuji1correctatomic')
    })
  })

  // ========================================
  // signEvmTransaction Tests
  // ========================================

  // Replaces the deleted private-method blocks (handleEthAndPersonalSign,
  // handleSignedTypedData, signEIP712WithFallback, ...). That logic now lives
  // in the SDK's LedgerSigner, so what is left to cover here is dispatch.
  describe('signMessage', () => {
    const evmNetwork = { chainId: 1, vmName: 'EVM' } as Network
    const evmProvider = Object.create(
      JsonRpcBatchInternal.prototype
    ) as JsonRpcBatchInternal

    const typedData = {
      domain: { name: 'Test', chainId: 1 },
      types: { Person: [{ name: 'name', type: 'string' }] },
      primaryType: 'Person',
      message: { name: 'alice' }
    }

    const sign = (signingData: unknown): Promise<string> =>
      ledgerWallet.signMessage({
        signingData: signingData as never,
        accountIndex: 0,
        network: evmNetwork,
        provider: evmProvider
      })

    it('routes personal_sign to the signer as a plain message', async () => {
      mockEvmSignMessage.mockResolvedValue('0xsig')

      await expect(
        sign({ type: RpcMethod.PERSONAL_SIGN, account: '0xa', data: '0xdead' })
      ).resolves.toBe('0xsig')
      expect(mockEvmSignMessage).toHaveBeenCalledWith('0xdead')
      expect(mockEvmSignTypedData).not.toHaveBeenCalled()
    })

    it('routes eth_sign to the signer as a plain message', async () => {
      mockEvmSignMessage.mockResolvedValue('0xsig')

      await sign({ type: RpcMethod.ETH_SIGN, account: '0xa', data: '0xdead' })

      expect(mockEvmSignMessage).toHaveBeenCalledWith('0xdead')
    })

    it('routes typed data v4 to signTypedData with domain, types and message', async () => {
      mockEvmSignTypedData.mockResolvedValue('0xtyped')

      await expect(
        sign({
          type: RpcMethod.SIGN_TYPED_DATA_V4,
          account: '0xa',
          data: typedData
        })
      ).resolves.toBe('0xtyped')
      expect(mockEvmSignTypedData).toHaveBeenCalledWith(
        typedData.domain,
        expect.objectContaining({ Person: typedData.types.Person }),
        typedData.message
      )
      expect(mockEvmSignMessage).not.toHaveBeenCalled()
    })

    it('rejects EIP-712 v1, which Ledger devices cannot display', async () => {
      await expect(
        sign({
          type: RpcMethod.SIGN_TYPED_DATA_V1,
          account: '0xa',
          data: [{ name: 'n', type: 'string', value: 'v' }]
        })
      ).rejects.toThrow(/v1 is not supported/)
    })

    it('rejects an EVM sign with a non-EVM provider', async () => {
      await expect(
        ledgerWallet.signMessage({
          signingData: {
            type: RpcMethod.PERSONAL_SIGN,
            account: '0xa',
            data: '0xdead'
          } as never,
          accountIndex: 0,
          network: evmNetwork,
          provider: {} as never
        })
      ).rejects.toThrow()
    })

    it('reports Solana message signing as unsupported', async () => {
      await expect(
        sign({ type: RpcMethod.SOLANA_SIGN_MESSAGE, account: 'a', data: 'b' })
      ).rejects.toThrow()
    })
  })

  describe('signEvmTransaction', () => {
    const mockNetwork = { chainId: 1 } as Network
    const mockProvider = {} as never

    const baseTransaction = {
      chainId: 1,
      nonce: 5,
      maxFeePerGas: BigInt('30000000000'), // 30 gwei
      maxPriorityFeePerGas: BigInt('2000000000'), // 2 gwei
      gasLimit: BigInt('21000'),
      to: '0x1234567890123456789012345678901234567890',
      value: BigInt('1000000000000000000'), // 1 ETH
      data: '0xdeadbeef',
      accessList: []
    }

    const signEvm = (
      transaction:
        | typeof baseTransaction
        | Record<string, unknown> = baseTransaction
    ): Promise<string> =>
      ledgerWallet.signEvmTransaction({
        accountIndex: 0,
        transaction: transaction as never,
        network: mockNetwork,
        provider: mockProvider
      })

    /** The tx object handed to the SDK signer. */
    const signedPayload = (): Record<string, unknown> =>
      mockEvmSignTransaction.mock.calls[0]?.[0] as Record<string, unknown>

    it('marks the transaction as EIP-1559 (type 2)', async () => {
      await signEvm()

      expect(signedPayload()).toMatchObject({ type: 2 })
    })

    it('passes maxFeePerGas and maxPriorityFeePerGas, not gasPrice', async () => {
      await signEvm()

      const tx = signedPayload()
      expect(tx.maxFeePerGas).toBe(baseTransaction.maxFeePerGas)
      expect(tx.maxPriorityFeePerGas).toBe(baseTransaction.maxPriorityFeePerGas)
      expect(tx).not.toHaveProperty('gasPrice')
    })

    it('does not swap maxFeePerGas and maxPriorityFeePerGas', async () => {
      await signEvm()

      const tx = signedPayload()
      expect(tx.maxFeePerGas).not.toBe(baseTransaction.maxPriorityFeePerGas)
      expect(tx.maxPriorityFeePerGas).not.toBe(baseTransaction.maxFeePerGas)
    })

    // Routing to the Ethereum app is gone: the Avalanche app now handles EVM
    // signing for every chain (CP-13954 / the CP-14259 revert).
    it('always signs through the Avalanche app', async () => {
      await signEvm()

      expect(mockOpenApp).toHaveBeenCalledWith(LedgerAppType.AVALANCHE)
      expect(mockWaitForApp).toHaveBeenCalledWith(
        LedgerAppType.AVALANCHE,
        expect.any(Number)
      )
    })

    it('builds the signer with the account index, session and derivation spec', async () => {
      await signEvm()

      expect(mockLedgerSigner).toHaveBeenCalledWith(
        0,
        expect.any(Object),
        'test-session-id',
        DerivationPath.BIP44,
        mockProvider
      )
    })

    it('returns whatever the signer produced', async () => {
      mockEvmSignTransaction.mockResolvedValue('0xdeadbeefsigned')

      await expect(signEvm()).resolves.toBe('0xdeadbeefsigned')
    })

    it('defaults nonce to 0 and data to 0x when absent', async () => {
      await signEvm({
        chainId: 1,
        maxFeePerGas: BigInt('30000000000'),
        maxPriorityFeePerGas: BigInt('2000000000'),
        gasLimit: BigInt('21000'),
        to: '0x1234567890123456789012345678901234567890',
        value: BigInt('0'),
        accessList: []
      })

      expect(signedPayload()).toMatchObject({ nonce: 0, data: '0x' })
    })

    it('propagates signing failures', async () => {
      mockEvmSignTransaction.mockRejectedValue(new Error('Signing failed'))

      await expect(signEvm()).rejects.toThrow()
    })
  })

  // ========================================
  // Private Methods Tests
  // ========================================

  describe('Private Methods', () => {
    describe('getTransport', () => {
      it('should call LedgerService.ensureConnection', async () => {
        // Remove the spy set up in beforeEach
        jest.restoreAllMocks()

        const mockTransport = new MockSession()
        mockEnsureConnection.mockResolvedValue(mockTransport as never)

        const result = await (ledgerWallet as any).getTransport()

        expect(mockEnsureConnection).toHaveBeenCalled()
        expect(result).toBe(mockTransport)
      })

      it('should throw error when transport is not available', async () => {
        // Remove the spy set up in beforeEach
        jest.restoreAllMocks()

        mockEnsureConnection.mockRejectedValue(
          new Error('transport_interface_not_available')
        )

        await expect((ledgerWallet as any).getTransport()).rejects.toThrow(
          'transport_interface_not_available'
        )
      })
    })

    describe('getDerivationPath', () => {
      it('should return BIP44 path for EVM when wallet uses BIP44', () => {
        const path = (ledgerWallet as any).getDerivationPath(
          0,
          NetworkVMType.EVM
        )
        expect(path).toBe("m/44'/60'/0'/0/0")
      })

      it('should return BIP44 path for AVM when wallet uses BIP44', () => {
        const path = (ledgerWallet as any).getDerivationPath(
          0,
          NetworkVMType.AVM
        )
        expect(path).toBe("m/44'/9000'/0'/0/0")
      })

      it('should handle different account indices for BIP44', () => {
        // The getDerivationPath method uses getAddressDerivationPath which
        // builds paths using ModuleManager. For EVM, accountIndex is used
        // in the address index position for BIP44 paths.
        const path0 = (ledgerWallet as any).getDerivationPath(
          0,
          NetworkVMType.EVM
        )
        const path1 = (ledgerWallet as any).getDerivationPath(
          1,
          NetworkVMType.EVM
        )
        const path5 = (ledgerWallet as any).getDerivationPath(
          5,
          NetworkVMType.EVM
        )

        // Verify the paths are being constructed correctly
        expect(path0).toContain("44'/60'")
        expect(path1).toContain("44'/60'")
        expect(path5).toContain("44'/60'")

        // Paths should be different for different account indices
        expect(path0).not.toBe(path1)
        expect(path0).not.toBe(path5)
        expect(path1).not.toBe(path5)
      })

      it('should return Ledger Live path for EVM when wallet uses Ledger Live', () => {
        const ledgerLiveWallet = new LedgerWallet({
          deviceId: mockDeviceId,
          derivationPathSpec: LedgerDerivationPathType.LedgerLive,
          publicKeys: mockPublicKeys,
          walletId: mockWalletId
        } as any) // Ledger Live wallets don't need extendedPublicKeys

        const path = (ledgerLiveWallet as any).getDerivationPath(
          0,
          NetworkVMType.EVM
        )
        expect(path).toContain("44'/60'")
      })
    })

    describe('getExtendedPublicKeyFor', () => {
      it('should return EVM extended public key for account 0', () => {
        const result = (ledgerWallet as any).getExtendedPublicKeyFor(
          NetworkVMType.EVM,
          0
        )
        expect(result).toEqual({ key: 'mock-evm-xpub' })
      })

      it('should return Avalanche extended public key for AVM', () => {
        const result = (ledgerWallet as any).getExtendedPublicKeyFor(
          NetworkVMType.AVM,
          0
        )
        expect(result).toEqual({ key: 'mock-avax-xpub' })
      })

      it('should return null for unsupported VM types', () => {
        const result = (ledgerWallet as any).getExtendedPublicKeyFor(
          NetworkVMType.BITCOIN,
          0
        )
        expect(result).toBeNull()
      })

      it('should throw error for Ledger Live wallets', () => {
        const ledgerLiveWallet = new LedgerWallet({
          deviceId: mockDeviceId,
          derivationPathSpec: LedgerDerivationPathType.LedgerLive,
          publicKeys: mockPublicKeys,
          walletId: mockWalletId
        } as any) // Ledger Live wallets don't need extendedPublicKeys

        expect(() =>
          (ledgerLiveWallet as any).getExtendedPublicKeyFor(
            NetworkVMType.EVM,
            0
          )
        ).toThrow(
          'Extended public keys are not available for Ledger Live wallets'
        )
      })

      it('should throw error when account xpub not found', () => {
        expect(() =>
          (ledgerWallet as any).getExtendedPublicKeyFor(NetworkVMType.EVM, 999)
        ).toThrow('No xpub found for account 999')
      })
    })

    describe('getKeyForVmType', () => {
      const mockKeys = {
        evm: 'evm-xpub',
        avalanche: 'avax-xpub'
      }

      it('should return EVM key for EVM vmType', () => {
        const result = (ledgerWallet as any).getKeyForVmType(
          mockKeys,
          NetworkVMType.EVM
        )
        expect(result).toEqual({ key: 'evm-xpub' })
      })

      it('should return Avalanche key for AVM vmType', () => {
        const result = (ledgerWallet as any).getKeyForVmType(
          mockKeys,
          NetworkVMType.AVM
        )
        expect(result).toEqual({ key: 'avax-xpub' })
      })

      it('should return null for unsupported vmType', () => {
        const result = (ledgerWallet as any).getKeyForVmType(
          mockKeys,
          NetworkVMType.BITCOIN
        )
        expect(result).toBeNull()
      })

      it('should return null when EVM key is missing', () => {
        const keysWithoutEvm = {
          evm: '',
          avalanche: 'avax-xpub'
        }
        const result = (ledgerWallet as any).getKeyForVmType(
          keysWithoutEvm,
          NetworkVMType.EVM
        )
        expect(result).toBeNull()
      })

      it('should return null when Avalanche key is missing', () => {
        const keysWithoutAvax = {
          evm: 'evm-xpub',
          avalanche: ''
        }
        const result = (ledgerWallet as any).getKeyForVmType(
          keysWithoutAvax,
          NetworkVMType.AVM
        )
        expect(result).toBeNull()
      })
    })

    describe('prepareBtcTxForLedger', () => {
      it('should fetch and attach tx hex for each unique input', async () => {
        const mockProvider = {
          getTxHex: jest
            .fn()
            .mockResolvedValueOnce('hex1')
            .mockResolvedValueOnce('hex2')
        } as unknown as BitcoinProviderAbstract

        const mockTx = {
          inputs: [
            { txHash: 'hash1', index: 0 },
            { txHash: 'hash2', index: 1 },
            { txHash: 'hash1', index: 2 } // Duplicate hash
          ],
          outputs: []
        }

        const result = await (ledgerWallet as any).prepareBtcTxForLedger(
          mockTx,
          mockProvider
        )

        expect(mockProvider.getTxHex).toHaveBeenCalledTimes(2) // Only unique hashes
        expect(mockProvider.getTxHex).toHaveBeenCalledWith('hash1')
        expect(mockProvider.getTxHex).toHaveBeenCalledWith('hash2')

        expect(result.inputs[0].txHex).toBe('hex1')
        expect(result.inputs[1].txHex).toBe('hex2')
        expect(result.inputs[2].txHex).toBe('hex1')
      })

      it('should handle empty inputs array', async () => {
        const mockProvider = {
          getTxHex: jest.fn()
        } as unknown as BitcoinProviderAbstract

        const mockTx = {
          inputs: [],
          outputs: []
        }

        const result = await (ledgerWallet as any).prepareBtcTxForLedger(
          mockTx,
          mockProvider
        )

        expect(mockProvider.getTxHex).not.toHaveBeenCalled()
        expect(result.inputs).toEqual([])
      })

      it('should throw error when getTxHex fails', async () => {
        const mockProvider = {
          getTxHex: jest.fn().mockRejectedValue(new Error('Network error'))
        } as unknown as BitcoinProviderAbstract

        const mockTx = {
          inputs: [{ txHash: 'hash1', index: 0 }],
          outputs: []
        }

        await expect(
          (ledgerWallet as any).prepareBtcTxForLedger(mockTx, mockProvider)
        ).rejects.toThrow('Network error')
      })
    })

    describe('signSolanaMessage', () => {
      it('should throw error as not implemented', async () => {
        await expect((ledgerWallet as any).signSolanaMessage()).rejects.toThrow(
          'Solana message signing not yet implemented for LedgerWallet'
        )
      })
    })

    describe('signAvalancheMessage', () => {
      // The message is run through toUtf8(), so callers pass hex, not text.
      const hexMessage = '0x48656c6c6f' // "Hello"

      const signMsg = (accountIndex = 0, data: unknown = hexMessage) =>
        (
          ledgerWallet as unknown as {
            signAvalancheMessage: (
              i: number,
              d: unknown,
              p: unknown
            ) => Promise<string>
          }
        ).signAvalancheMessage(accountIndex, data, {} as never)

      it('sends the decoded message on the X chain with the DMK session', async () => {
        await signMsg()

        expect(mockAvaSignMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Hello',
            chain: 'X',
            sessionId: 'test-session-id',
            dmk: expect.any(Object)
          })
        )
      })

      it('returns the signature as hex', async () => {
        mockAvaSignMessage.mockResolvedValue(Buffer.from('cafe', 'hex'))

        await expect(signMsg()).resolves.toBe('cafe')
      })

      it('builds the signer for the requested account index', async () => {
        await signMsg(0)

        expect(mockSimpleLedgerSigner).toHaveBeenCalledWith(
          0,
          expect.anything(),
          undefined,
          DerivationPath.BIP44
        )
      })

      it('propagates app connection errors', async () => {
        mockEnsureConnection.mockRejectedValueOnce(
          new Error('Connection failed')
        )

        await expect(signMsg()).rejects.toThrow('Connection failed')
      })

      it('propagates signing errors', async () => {
        mockAvaSignMessage.mockRejectedValue(new Error('Signing failed'))

        await expect(signMsg()).rejects.toThrow()
      })
    })

    describe('filterEIP712Types', () => {
      it('should include only primary type and its dependencies', () => {
        const types = {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' }
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' }
          ],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
            { name: 'contents', type: 'string' }
          ],
          UnusedType: [{ name: 'unused', type: 'string' }]
        }

        const domain = { name: 'Test', version: '1' }
        const filtered = (ledgerWallet as any).filterEIP712Types(
          types,
          'Mail',
          domain
        )

        expect(Object.keys(filtered)).toEqual(
          expect.arrayContaining(['EIP712Domain', 'Mail', 'Person'])
        )
        expect(Object.keys(filtered)).not.toContain('UnusedType')
        expect(Object.keys(filtered).length).toBe(3)
      })

      it('should handle types without dependencies', () => {
        const types = {
          EIP712Domain: [{ name: 'name', type: 'string' }],
          Message: [
            { name: 'content', type: 'string' },
            { name: 'value', type: 'uint256' }
          ]
        }

        const domain = { name: 'Test' }
        const filtered = (ledgerWallet as any).filterEIP712Types(
          types,
          'Message',
          domain
        )

        expect(Object.keys(filtered)).toEqual(['EIP712Domain', 'Message'])
      })

      it('should infer EIP712Domain from domain object when not provided', () => {
        const types = {
          Message: [{ name: 'content', type: 'string' }]
        }

        const domain = {
          name: 'Test App',
          version: '1',
          chainId: 1,
          verifyingContract: '0x1234567890123456789012345678901234567890'
        }

        const filtered = (ledgerWallet as any).filterEIP712Types(
          types,
          'Message',
          domain
        )

        expect(filtered.EIP712Domain).toBeDefined()
        expect(filtered.EIP712Domain.length).toBe(4)
        expect(filtered.EIP712Domain).toEqual(
          expect.arrayContaining([
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' }
          ])
        )
      })

      it('should handle array types', () => {
        const types = {
          EIP712Domain: [{ name: 'name', type: 'string' }],
          Person: [{ name: 'name', type: 'string' }],
          Group: [
            { name: 'members', type: 'Person[]' },
            { name: 'name', type: 'string' }
          ]
        }

        const domain = { name: 'Test' }
        const filtered = (ledgerWallet as any).filterEIP712Types(
          types,
          'Group',
          domain
        )

        expect(Object.keys(filtered)).toEqual(
          expect.arrayContaining(['EIP712Domain', 'Group', 'Person'])
        )
      })

      it('should handle nested dependencies', () => {
        const types = {
          EIP712Domain: [{ name: 'name', type: 'string' }],
          Address: [{ name: 'street', type: 'string' }],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'address', type: 'Address' }
          ],
          Company: [
            { name: 'name', type: 'string' },
            { name: 'ceo', type: 'Person' }
          ]
        }

        const domain = { name: 'Test' }
        const filtered = (ledgerWallet as any).filterEIP712Types(
          types,
          'Company',
          domain
        )

        expect(Object.keys(filtered)).toEqual(
          expect.arrayContaining([
            'EIP712Domain',
            'Company',
            'Person',
            'Address'
          ])
        )
      })
    })

    describe('handleAppConnection', () => {
      it('should ensure connection and wait for app', async () => {
        await (ledgerWallet as any).handleAppConnection(LedgerAppType.AVALANCHE)

        expect(mockEnsureConnection).toHaveBeenCalled()
        expect(mockOpenApp).toHaveBeenCalledWith(LedgerAppType.AVALANCHE)
        expect(mockWaitForApp).toHaveBeenCalledWith(
          LedgerAppType.AVALANCHE,
          expect.any(Number)
        )
      })

      it('should handle different app types', async () => {
        await (ledgerWallet as any).handleAppConnection(LedgerAppType.ETHEREUM)

        expect(mockOpenApp).toHaveBeenCalledWith(LedgerAppType.ETHEREUM)
        expect(mockWaitForApp).toHaveBeenCalledWith(
          LedgerAppType.ETHEREUM,
          expect.any(Number)
        )
      })

      it('should throw error when connection fails', async () => {
        mockEnsureConnection.mockRejectedValueOnce(
          new Error('Device not found')
        )

        await expect(
          (ledgerWallet as any).handleAppConnection(LedgerAppType.AVALANCHE)
        ).rejects.toThrow('Device not found')
      })

      it('should throw error when app is not ready', async () => {
        mockWaitForApp.mockRejectedValue(new Error('App timeout'))

        await expect(
          (ledgerWallet as any).handleAppConnection(LedgerAppType.BITCOIN)
        ).rejects.toThrow('App timeout')
      })
    })

    describe('getBitcoinSigner', () => {
      const mockNetwork = {
        isTestnet: false,
        vmName: 'BITCOIN'
      } as Network

      beforeEach(() => {
        // Mock BitcoinWalletPolicyService methods
        ;(
          BitcoinWalletPolicyService.getEvmPublicKey as jest.Mock
        ).mockReturnValue({
          key: 'mock-evm-key',
          derivationPath: "m/44'/60'/0'/0/0",
          curve: 'secp256k1'
        })
        ;(
          BitcoinWalletPolicyService.findBtcWalletPolicyInPublicKeys as jest.Mock
        ).mockReturnValue({
          xpub: 'xpub123',
          derivationPath: "m/44'/60'/0'",
          hmacHex: 'abc123'
        })
        ;(
          BitcoinWalletPolicyService.parseWalletPolicyDetailsFromPublicKey as jest.Mock
        ).mockReturnValue({
          name: 'Test Policy',
          hmac: Buffer.from('abc123', 'hex')
        })

        // Mock bip32
        const mockDerive = jest.fn().mockReturnValue({
          derive: jest.fn().mockReturnValue({
            publicKey: Buffer.from('mock-btc-public-key')
          })
        })
        ;(bip32.fromBase58 as jest.Mock).mockReturnValue({
          derive: mockDerive
        })

        // Mock Bitcoin provider
        ;(getBitcoinProvider as jest.Mock).mockResolvedValue({
          getBalance: jest.fn()
        })
      })

      it('should create BitcoinLedgerWallet with correct parameters', async () => {
        const mockProvider = { getBalance: jest.fn() } as any

        const result = await (ledgerWallet as any).getBitcoinSigner(
          0,
          mockProvider,
          mockNetwork
        )

        expect(BitcoinWalletPolicyService.getEvmPublicKey).toHaveBeenCalledWith(
          mockPublicKeys[0],
          0
        )
        expect(
          BitcoinWalletPolicyService.findBtcWalletPolicyInPublicKeys
        ).toHaveBeenCalledWith(mockPublicKeys[0], 0)
        expect(result).toBeDefined()
      })

      it('should throw error when EVM public key not found', async () => {
        ;(
          BitcoinWalletPolicyService.getEvmPublicKey as jest.Mock
        ).mockReturnValue(null)

        const mockProvider = { getBalance: jest.fn() } as any

        await expect(
          (ledgerWallet as any).getBitcoinSigner(0, mockProvider, mockNetwork)
        ).rejects.toThrow('EVM public key not found for account index 0')
      })

      it('should throw error when Bitcoin wallet policy not found', async () => {
        ;(
          BitcoinWalletPolicyService.findBtcWalletPolicyInPublicKeys as jest.Mock
        ).mockReturnValue(undefined)

        const mockProvider = { getBalance: jest.fn() } as any

        await expect(
          (ledgerWallet as any).getBitcoinSigner(0, mockProvider, mockNetwork)
        ).rejects.toThrow('Bitcoin wallet policy not found in public keys')
      })

      it('should use testnet network when isTestnet is true', async () => {
        const testnetNetwork = { ...mockNetwork, isTestnet: true }
        const mockProvider = { getBalance: jest.fn() } as any

        await (ledgerWallet as any).getBitcoinSigner(
          0,
          mockProvider,
          testnetNetwork
        )

        expect(bip32.fromBase58).toHaveBeenCalledWith(
          'xpub123',
          expect.anything()
        )
      })
    })

    // The kit's device actions each run OpenAppDeviceAction({ appName:
    // 'Bitcoin' }) unless told to skip, which closes the Bitcoin Recovery app
    // and opens the plain Bitcoin one — the app Core cannot use past
    // MAX_BITCOIN_APP_VERSION.
    describe('registerBitcoinWalletPolicy', () => {
      beforeEach(() => {
        ;(
          BitcoinWalletPolicyService.storeBtcWalletPolicy as jest.Mock
        ).mockResolvedValue(true)
      })

      const register = () =>
        (ledgerWallet as any).registerBitcoinWalletPolicy({
          accountName: 'Account 1',
          accountIndex: 0,
          walletId: mockWalletId
        })

      it('never lets the signer kit switch the Ledger app', async () => {
        await register()

        expect(mockGetMasterFingerprint).toHaveBeenCalledWith({
          skipOpenApp: true
        })
        expect(mockGetDeviceExtendedPublicKey).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ skipOpenApp: true })
        )
        expect(mockRegisterWallet).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ skipOpenApp: true })
        )
      })

      // get_extended_pubkey answers 0x6a82 for Core's 44'/60'/x' path unless the
      // key is displayed for confirmation, so display must stay on.
      it('asks the device to display the key so the non-standard path is accepted', async () => {
        await register()

        expect(mockGetDeviceExtendedPublicKey).toHaveBeenCalledWith(
          expect.any(String),
          { checkOnDevice: true, skipOpenApp: true }
        )
      })
    })

    describe('signBtcTransaction app readiness', () => {
      it('establishes the app itself now that the kit no longer does', async () => {
        ;(
          BitcoinWalletPolicyService.needsBtcWalletPolicyRegistration as jest.Mock
        ).mockReturnValue(false)
        ;(getBitcoinProvider as jest.Mock).mockRejectedValue(
          new Error('stop after the app gate')
        )

        await expect(
          ledgerWallet.signBtcTransaction({
            accountIndex: 0,
            transaction: {} as any,
            network: { isTestnet: false, vmName: 'BITCOIN' } as Network,
            provider: {} as any
          })
        ).rejects.toThrow()

        expect(mockWaitForApp).toHaveBeenCalledWith(
          LedgerAppType.BITCOIN,
          expect.any(Number)
        )
      })
    })
  })

  // ---------------------------------------------------------------------------
  // getPublicKeyFor
  // ---------------------------------------------------------------------------
  describe('getPublicKeyFor', () => {
    /**
     * Build a two-level mock derivation chain that simulates bip32 node.derive().
     * The leaf node exposes a publicKey Buffer so callers can assert on the hex.
     */
    const makeDerivationChain = (leafPubKeyHex: string) => {
      const leafNode = { publicKey: Buffer.from(leafPubKeyHex, 'hex') }
      const changeNode = { derive: jest.fn().mockReturnValue(leafNode) }
      const accountNode = { derive: jest.fn().mockReturnValue(changeNode) }
      return { accountNode, changeNode, leafNode }
    }

    /**
     * EVM xpub stubs (opaque strings; the mock doesn't parse them).
     * Account indices map to real-world BIP44 account derivation slots.
     */
    const EVM_XPUB: Record<number, string> = {
      0: 'xpub-evm-account-0',
      1: 'xpub-evm-account-1',
      2: 'xpub-evm-account-2'
    }
    const AVAX_XPUB: Record<number, string> = {
      0: 'xpub-avax-account-0',
      1: 'xpub-avax-account-1'
    }

    let bip44WalletMulti: LedgerWallet

    beforeEach(() => {
      bip44WalletMulti = new LedgerWallet({
        deviceId: mockDeviceId,
        derivationPathSpec: LedgerDerivationPathType.BIP44,
        publicKeys: {
          0: [
            {
              key: 'fallback-key-0',
              derivationPath: "m/44'/60'/0'/0/0",
              curve: Curve.SECP256K1
            }
          ],
          1: [
            {
              key: 'fallback-key-1',
              derivationPath: "m/44'/60'/1'/0/0",
              curve: Curve.SECP256K1
            }
          ],
          2: []
        },
        walletId: mockWalletId,
        extendedPublicKeys: {
          0: { evm: EVM_XPUB[0]!, avalanche: AVAX_XPUB[0]! },
          1: { evm: EVM_XPUB[1]!, avalanche: AVAX_XPUB[1]! },
          2: { evm: EVM_XPUB[2]!, avalanche: 'xpub-avax-account-2' }
        }
      })
    })

    describe("BIP44 wallet — EVM paths (m/44'/60'/{account}'/0/{index})", () => {
      it('account 0: uses evm xpub[0] and derives change=0, address=0', async () => {
        const expectedHex =
          '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'
        const { accountNode, changeNode } = makeDerivationChain(expectedHex)
        ;(bip32.fromBase58 as jest.Mock).mockReturnValue(accountNode)

        const result = await bip44WalletMulti.getPublicKeyFor({
          derivationPath: "m/44'/60'/0'/0/0",
          curve: Curve.SECP256K1
        })

        expect(bip32.fromBase58).toHaveBeenCalledWith(EVM_XPUB[0])
        expect(accountNode.derive).toHaveBeenCalledWith(0) // change segment
        expect(changeNode.derive).toHaveBeenCalledWith(0) // address segment
        expect(result).toBe(expectedHex)
      })

      it('account 1: uses evm xpub[1] (not xpub[0])', async () => {
        const expectedHex =
          '02c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee5'
        const { accountNode, changeNode } = makeDerivationChain(expectedHex)
        ;(bip32.fromBase58 as jest.Mock).mockReturnValue(accountNode)

        const result = await bip44WalletMulti.getPublicKeyFor({
          derivationPath: "m/44'/60'/1'/0/0",
          curve: Curve.SECP256K1
        })

        expect(bip32.fromBase58).toHaveBeenCalledWith(EVM_XPUB[1])
        expect(accountNode.derive).toHaveBeenCalledWith(0)
        expect(changeNode.derive).toHaveBeenCalledWith(0)
        expect(result).toBe(expectedHex)
      })

      it('account 2: uses evm xpub[2]', async () => {
        const expectedHex =
          '02f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f9'
        const { accountNode } = makeDerivationChain(expectedHex)
        ;(bip32.fromBase58 as jest.Mock).mockReturnValue(accountNode)

        await bip44WalletMulti.getPublicKeyFor({
          derivationPath: "m/44'/60'/2'/0/0",
          curve: Curve.SECP256K1
        })

        expect(bip32.fromBase58).toHaveBeenCalledWith(EVM_XPUB[2])
      })

      it('address index 3: passes correct index to second derive call', async () => {
        const expectedHex =
          '03e493dbf1c10d80f3581e4904930b1404cc6c13900ee0758474fa94abe8c4cd13'
        const { accountNode, changeNode } = makeDerivationChain(expectedHex)
        ;(bip32.fromBase58 as jest.Mock).mockReturnValue(accountNode)

        const result = await bip44WalletMulti.getPublicKeyFor({
          derivationPath: "m/44'/60'/0'/0/3",
          curve: Curve.SECP256K1
        })

        expect(accountNode.derive).toHaveBeenCalledWith(0) // change = 0
        expect(changeNode.derive).toHaveBeenCalledWith(3) // address = 3
        expect(result).toBe(expectedHex)
      })
    })

    describe("BIP44 wallet — Avalanche paths (m/44'/9000'/{account}'/0/{index})", () => {
      it('account 0: uses avalanche xpub[0] and derives 0/0', async () => {
        const expectedHex =
          '02e493dbf1c10d80f3581e4904930b1404cc6c13900ee0758474fa94abe8c4cd13'
        const { accountNode, changeNode } = makeDerivationChain(expectedHex)
        ;(bip32.fromBase58 as jest.Mock).mockReturnValue(accountNode)

        const result = await bip44WalletMulti.getPublicKeyFor({
          derivationPath: "m/44'/9000'/0'/0/0",
          curve: Curve.SECP256K1
        })

        expect(bip32.fromBase58).toHaveBeenCalledWith(AVAX_XPUB[0])
        expect(accountNode.derive).toHaveBeenCalledWith(0)
        expect(changeNode.derive).toHaveBeenCalledWith(0)
        expect(result).toBe(expectedHex)
      })

      it('account 1: uses avalanche xpub[1] (not xpub[0])', async () => {
        const expectedHex =
          '03a1af804ac108a8a51782198c2d034b28bf90c8803f5a53f76276fa69a4eae77f'
        const { accountNode } = makeDerivationChain(expectedHex)
        ;(bip32.fromBase58 as jest.Mock).mockReturnValue(accountNode)

        await bip44WalletMulti.getPublicKeyFor({
          derivationPath: "m/44'/9000'/1'/0/0",
          curve: Curve.SECP256K1
        })

        expect(bip32.fromBase58).toHaveBeenCalledWith(AVAX_XPUB[1])
      })

      it('address index 5: passes correct index to second derive call', async () => {
        const expectedHex =
          '02d7924d4f7d43ea965a465ae3095ff41131e5946f3c85f79e44adbcf8e27e080e'
        const { accountNode, changeNode } = makeDerivationChain(expectedHex)
        ;(bip32.fromBase58 as jest.Mock).mockReturnValue(accountNode)

        const result = await bip44WalletMulti.getPublicKeyFor({
          derivationPath: "m/44'/9000'/0'/0/5",
          curve: Curve.SECP256K1
        })

        expect(accountNode.derive).toHaveBeenCalledWith(0)
        expect(changeNode.derive).toHaveBeenCalledWith(5)
        expect(result).toBe(expectedHex)
      })
    })

    describe('known xpub-derived value — real BIP32 derivation', () => {
      /**
       * These tests use the actual bip32 library (via jest.requireActual) to
       * confirm that, given a published BIP32 test-vector xpub, getPublicKeyFor
       * returns the deterministic compressed public key at child path 0/0.
       *
       * Test vectors taken from:
       *   BIP32 Test Vector 1 — https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
       *
       * Chain m/0H extended public key:
       *   xpub68Gmy5EdvgibQVfPdqkBBCHxA5htiqg55crXYuXoQRKfDBFA1WEjWgP6LHhwBZeNK1VTsfTFUHCdrfp1bgwQ9xv5ski8PX9rL2dZXvgGDnw
       *
       * We use this as a stand-in for a BIP44 account-level EVM xpub stored in
       * extendedPublicKeys[0].evm and verify that derive(0).derive(0).publicKey
       * matches the known expected hex.
       */
      const BIP32_TV1_M0H_XPUB =
        'xpub68Gmy5EdvgibQVfPdqkBBCHxA5htiqg55crXYuXoQRKfDBFA1WEjWgP6LHhwBZeNK1VTsfTFUHCdrfp1bgwQ9xv5ski8PX9rL2dZXvgGDnw'

      it('EVM path: returns hex matching real bip32 derive(0).derive(0)', async () => {
        const { bip32: realBip32 } =
          jest.requireActual<typeof import('utils/bip32')>('utils/bip32')

        // Compute ground-truth using the real library
        const expectedHex = realBip32
          .fromBase58(BIP32_TV1_M0H_XPUB)
          .derive(0)
          .derive(0)
          .publicKey.toString('hex')

        // Wire the real implementation into the mock so LedgerWallet uses it
        ;(bip32.fromBase58 as jest.Mock).mockImplementation(
          realBip32.fromBase58.bind(realBip32)
        )

        const wallet = new LedgerWallet({
          deviceId: mockDeviceId,
          derivationPathSpec: LedgerDerivationPathType.BIP44,
          publicKeys: {},
          walletId: mockWalletId,
          extendedPublicKeys: {
            0: { evm: BIP32_TV1_M0H_XPUB, avalanche: BIP32_TV1_M0H_XPUB }
          }
        })

        const result = await wallet.getPublicKeyFor({
          derivationPath: "m/44'/60'/0'/0/0",
          curve: Curve.SECP256K1
        })

        expect(result).toBe(expectedHex)
        // Compressed SECP256K1 pubkey: 33 bytes = 66 hex chars, starts with 02 or 03
        expect(result).toMatch(/^0[23][0-9a-f]{64}$/)
      })

      it('Avalanche path: returns hex matching real bip32 derive(0).derive(0)', async () => {
        const { bip32: realBip32 } =
          jest.requireActual<typeof import('utils/bip32')>('utils/bip32')

        const expectedHex = realBip32
          .fromBase58(BIP32_TV1_M0H_XPUB)
          .derive(0)
          .derive(0)
          .publicKey.toString('hex')

        ;(bip32.fromBase58 as jest.Mock).mockImplementation(
          realBip32.fromBase58.bind(realBip32)
        )

        const wallet = new LedgerWallet({
          deviceId: mockDeviceId,
          derivationPathSpec: LedgerDerivationPathType.BIP44,
          publicKeys: {},
          walletId: mockWalletId,
          extendedPublicKeys: {
            0: { evm: BIP32_TV1_M0H_XPUB, avalanche: BIP32_TV1_M0H_XPUB }
          }
        })

        const result = await wallet.getPublicKeyFor({
          derivationPath: "m/44'/9000'/0'/0/0",
          curve: Curve.SECP256K1
        })

        expect(result).toBe(expectedHex)
        expect(result).toMatch(/^0[23][0-9a-f]{64}$/)
      })

      it('EVM account 1: selects xpub[1] and returns correct derived key', async () => {
        const { bip32: realBip32 } =
          jest.requireActual<typeof import('utils/bip32')>('utils/bip32')

        // BIP32 test vector 1 m/0H/1 xpub (child 1 of m/0H)
        const BIP32_TV1_M0H1_XPUB = realBip32
          .fromBase58(BIP32_TV1_M0H_XPUB)
          .derive(1)
          .neutered()
          .toBase58()

        const expectedHex = realBip32
          .fromBase58(BIP32_TV1_M0H1_XPUB)
          .derive(0)
          .derive(0)
          .publicKey.toString('hex')

        ;(bip32.fromBase58 as jest.Mock).mockImplementation(
          realBip32.fromBase58.bind(realBip32)
        )

        const wallet = new LedgerWallet({
          deviceId: mockDeviceId,
          derivationPathSpec: LedgerDerivationPathType.BIP44,
          publicKeys: {},
          walletId: mockWalletId,
          extendedPublicKeys: {
            0: { evm: 'unused-account-0', avalanche: 'unused' },
            1: { evm: BIP32_TV1_M0H1_XPUB, avalanche: 'unused' }
          }
        })

        const result = await wallet.getPublicKeyFor({
          derivationPath: "m/44'/60'/1'/0/0",
          curve: Curve.SECP256K1
        })

        expect(result).toBe(expectedHex)
        expect(result).toMatch(/^0[23][0-9a-f]{64}$/)
      })
    })

    describe('error cases', () => {
      it('throws when derivationPath is undefined', async () => {
        await expect(
          bip44WalletMulti.getPublicKeyFor({
            derivationPath: undefined,
            curve: Curve.SECP256K1
          })
        ).rejects.toThrow(
          'derivationPath is required to get public key for LedgerWallet'
        )
      })

      it('throws when no xpub for the account index', async () => {
        // Account index 99 has no xpub in extendedPublicKeys and no fallback publicKey
        await expect(
          bip44WalletMulti.getPublicKeyFor({
            derivationPath: "m/44'/60'/99'/0/0",
            curve: Curve.SECP256K1
          })
        ).rejects.toThrow()
      })

      it('falls back to publicKeys when xpub derivation returns undefined (unrecognised coin type)', async () => {
        // A path whose coin type doesn't match EVM (60) or Avalanche (9000) causes
        // derivePublicKeyFromXpub to return undefined, triggering the publicKeys fallback.
        const customKey = 'custom-secp256k1-pubkey'
        const customPath = "m/44'/9999'/0'/0/0"
        const customWallet = new LedgerWallet({
          deviceId: mockDeviceId,
          derivationPathSpec: LedgerDerivationPathType.BIP44,
          publicKeys: {
            0: [
              {
                key: customKey,
                derivationPath: customPath,
                curve: Curve.SECP256K1
              }
            ]
          },
          walletId: mockWalletId,
          extendedPublicKeys: {
            0: { evm: EVM_XPUB[0]!, avalanche: AVAX_XPUB[0]! }
          }
        })

        const result = await customWallet.getPublicKeyFor({
          derivationPath: customPath,
          curve: Curve.SECP256K1
        })

        expect(result).toBe(customKey)
        // bip32 must NOT be called when derivation falls back to publicKeys lookup
        expect(bip32.fromBase58).not.toHaveBeenCalled()
      })

      it('throws when publicKeys fallback finds no matching entry', async () => {
        // Coin type 9999 → xpub derivation returns undefined → publicKeys fallback
        // Account 0 in bip44WalletMulti has no entry for this path/curve combo.
        await expect(
          bip44WalletMulti.getPublicKeyFor({
            derivationPath: "m/44'/9999'/0'/0/0",
            curve: Curve.SECP256K1
          })
        ).rejects.toThrow(
          "No public key found for derivation path m/44'/9999'/0'/0/0 and curve secp256k1"
        )
      })
    })

    describe('Ledger Live wallet (non-BIP44) — publicKeys fallback', () => {
      it('returns stored key when derivationPath and curve match', async () => {
        const ledgerLiveWallet = new LedgerWallet({
          deviceId: mockDeviceId,
          derivationPathSpec: LedgerDerivationPathType.LedgerLive,
          publicKeys: {
            0: [
              {
                key: 'ledger-live-evm-pubkey',
                derivationPath: "m/44'/60'/0'/0/0",
                curve: Curve.SECP256K1
              }
            ]
          },
          walletId: mockWalletId
        })

        const result = await ledgerLiveWallet.getPublicKeyFor({
          derivationPath: "m/44'/60'/0'/0/0",
          curve: Curve.SECP256K1
        })

        expect(result).toBe('ledger-live-evm-pubkey')
        // bip32 must NOT be called for Ledger Live wallets
        expect(bip32.fromBase58).not.toHaveBeenCalled()
      })

      it('throws when no matching key found in publicKeys', async () => {
        const ledgerLiveWallet = new LedgerWallet({
          deviceId: mockDeviceId,
          derivationPathSpec: LedgerDerivationPathType.LedgerLive,
          publicKeys: {
            0: [
              {
                key: 'ledger-live-evm-pubkey',
                derivationPath: "m/44'/60'/0'/0/0",
                curve: Curve.SECP256K1
              }
            ]
          },
          walletId: mockWalletId
        })

        await expect(
          ledgerLiveWallet.getPublicKeyFor({
            derivationPath: "m/44'/60'/1'/0/0", // account 1, not stored
            curve: Curve.SECP256K1
          })
        ).rejects.toThrow('No public keys available for LedgerWallet')
      })
    })
  })
})
