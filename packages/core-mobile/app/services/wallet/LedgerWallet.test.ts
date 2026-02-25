import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import { Avalanche, BitcoinProviderAbstract } from '@avalabs/core-wallets-sdk'
import { RpcMethod } from '@avalabs/vm-module-types'
import { Curve } from 'utils/publicKeys'
import { LedgerAppType, LedgerDerivationPathType } from 'services/ledger/types'

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
jest.mock('services/ledger/LedgerService', () => ({
  __esModule: true,
  default: {
    openApp: jest.fn().mockResolvedValue(undefined),
    ensureConnection: jest.fn().mockResolvedValue({
      send: jest.fn(),
      close: jest.fn()
    }),
    waitForApp: jest.fn().mockResolvedValue(undefined),
    isConnected: jest.fn().mockReturnValue(true),
    getCurrentAppType: jest.fn().mockReturnValue('AVALANCHE')
  }
}))

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
const mockEthGetAddress = jest.fn()
const mockEthSignTransaction = jest.fn()
const mockEthSignPersonalMessage = jest.fn()
const mockEthSignEIP712Message = jest.fn()
const mockEthSignEIP712HashedMessage = jest.fn()

jest.mock('@ledgerhq/hw-app-eth', () => {
  return {
    __esModule: true,
    default: class MockEthApp {
      getAddress = mockEthGetAddress
      signTransaction = mockEthSignTransaction
      signPersonalMessage = mockEthSignPersonalMessage
      signEIP712Message = mockEthSignEIP712Message
      signEIP712HashedMessage = mockEthSignEIP712HashedMessage
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      constructor(_transport: unknown) {}
    }
  }
})

// Mock Bitcoin app
const mockGetMasterFingerprint = jest.fn()
const mockGetExtendedPubkey = jest.fn()
const mockRegisterWallet = jest.fn()

jest.mock('ledger-bitcoin', () => {
  return {
    AppClient: class MockBtcClient {
      getMasterFingerprint = mockGetMasterFingerprint
      getExtendedPubkey = mockGetExtendedPubkey
      registerWallet = mockRegisterWallet
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      constructor(_transport: unknown) {}
    },
    DefaultWalletPolicy: jest.fn(),
    WalletPolicy: jest.fn()
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
  }
}))

// Mock providerUtils
jest.mock('services/network/utils/providerUtils', () => ({
  getBitcoinProvider: jest.fn()
}))

// Mock BitcoinLedgerWallet
jest.mock('@avalabs/core-wallets-sdk', () => ({
  ...jest.requireActual('@avalabs/core-wallets-sdk'),
  BitcoinLedgerWallet: jest.fn().mockImplementation(() => ({
    signTx: jest.fn()
  }))
}))

// Mock isAvalancheChainId to control Avalanche vs Ethereum app selection
jest.mock('services/network/utils/isAvalancheNetwork', () => ({
  isAvalancheChainId: jest.fn().mockReturnValue(false)
}))

// Import after mocking
import LedgerService from 'services/ledger/LedgerService'
import { bip32 } from 'utils/bip32'
import { getBitcoinProvider } from 'services/network/utils/providerUtils'
import { isAvalancheChainId } from 'services/network/utils/isAvalancheNetwork'
import { AvalancheTransactionRequest } from './types'
import { LedgerWallet } from './LedgerWallet'
import { BitcoinWalletPolicyService } from './BitcoinWalletPolicyService'

// Get references to the mocked functions
const mockOpenApp = LedgerService.openApp as jest.Mock
const mockEnsureConnection = LedgerService.ensureConnection as jest.Mock
const mockWaitForApp = LedgerService.waitForApp as jest.Mock
const mockIsConnected = LedgerService.isConnected as jest.Mock
const mockGetCurrentAppType = LedgerService.getCurrentAppType as jest.Mock

// Mock transport
class MockTransport {
  send = jest.fn()
  close = jest.fn()
}

// Helper functions to create mock transactions
const createCChainTx = () => ({
  getVM: jest.fn().mockReturnValue('EVM'),
  toBytes: jest.fn().mockReturnValue(new Uint8Array()),
  addSignature: jest.fn(),
  toJSON: jest.fn().mockReturnValue({})
})

const createXChainTx = () => ({
  getVM: jest.fn().mockReturnValue('AVM'),
  toBytes: jest.fn().mockReturnValue(new Uint8Array()),
  addSignature: jest.fn(),
  toJSON: jest.fn().mockReturnValue({})
})

const createPChainTx = () => ({
  getVM: jest.fn().mockReturnValue('PVM'),
  toBytes: jest.fn().mockReturnValue(new Uint8Array()),
  addSignature: jest.fn(),
  toJSON: jest.fn().mockReturnValue({})
})

describe('LedgerWallet', () => {
  let ledgerWallet: LedgerWallet
  const mockDeviceId = 'test-device-id'
  const mockWalletId = 'test-wallet-id'
  const mockPublicKeys = [
    {
      key: 'mock-public-key',
      derivationPath: "m/44'/60'/0'/0/0",
      curve: Curve.SECP256K1
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()

    // Reset and configure mocks with default behavior
    mockOpenApp.mockResolvedValue(undefined)
    mockEnsureConnection.mockResolvedValue(new MockTransport() as never)
    mockWaitForApp.mockResolvedValue(undefined)
    mockIsConnected.mockReturnValue(true)
    mockGetCurrentAppType.mockReturnValue('AVALANCHE')
    ;(isAvalancheChainId as jest.Mock).mockReturnValue(false)

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

    // Spy on getTransport to return mock transport
    jest
      .spyOn(ledgerWallet as never, 'getTransport')
      .mockResolvedValue(new MockTransport() as never)
  })

  describe('signAvalancheTransaction', () => {
    const mockNetwork = { vmName: 'AVM', isTestnet: false } as Network
    const mockProvider = {} as Avalanche.JsonRpcProvider

    describe('chainAlias mapping', () => {
      it('should map AVM to chainAlias "X"', async () => {
        const mockTx = {
          getVM: jest.fn().mockReturnValue('AVM'),
          toBytes: jest.fn().mockReturnValue(new Uint8Array()),
          addSignature: jest.fn(),
          toJSON: jest.fn().mockReturnValue({})
        }

        const transaction: AvalancheTransactionRequest = {
          tx: mockTx as unknown as AvalancheTransactionRequest['tx'],
          externalIndices: [0]
        }

        await ledgerWallet.signAvalancheTransaction({
          accountIndex: 0,
          transaction,
          network: mockNetwork,
          provider: mockProvider
        })

        // Verify sign was called with X-chain path
        expect(mockSign).toHaveBeenCalledWith(
          "m/44'/9000'/0'",
          ['0/0'],
          expect.any(Buffer),
          undefined
        )
      })

      it('should map PVM to chainAlias "P"', async () => {
        const mockTx = {
          getVM: jest.fn().mockReturnValue('PVM'),
          toBytes: jest.fn().mockReturnValue(new Uint8Array()),
          addSignature: jest.fn(),
          toJSON: jest.fn().mockReturnValue({})
        }

        const transaction: AvalancheTransactionRequest = {
          tx: mockTx as unknown as AvalancheTransactionRequest['tx'],
          externalIndices: [0]
        }

        await ledgerWallet.signAvalancheTransaction({
          accountIndex: 0,
          transaction,
          network: mockNetwork,
          provider: mockProvider
        })

        // Verify sign was called with P-chain path (same as X-chain for derivation)
        expect(mockSign).toHaveBeenCalledWith(
          "m/44'/9000'/0'",
          ['0/0'],
          expect.any(Buffer),
          undefined
        )
      })

      it('should map EVM to chainAlias "C"', async () => {
        const mockTx = {
          getVM: jest.fn().mockReturnValue('EVM'),
          toBytes: jest.fn().mockReturnValue(new Uint8Array()),
          addSignature: jest.fn(),
          toJSON: jest.fn().mockReturnValue({})
        }

        const transaction: AvalancheTransactionRequest = {
          tx: mockTx as unknown as AvalancheTransactionRequest['tx']
        }

        await ledgerWallet.signAvalancheTransaction({
          accountIndex: 0,
          transaction,
          network: mockNetwork,
          provider: mockProvider
        })

        // Verify sign was called with C-chain path
        expect(mockSign).toHaveBeenCalledWith(
          "m/44'/60'/0'",
          ['0/0'],
          expect.any(Buffer),
          undefined
        )
      })

      it('should throw error for unsupported VM type', async () => {
        const mockTx = {
          getVM: jest.fn().mockReturnValue('UNKNOWN_VM'),
          toBytes: jest.fn().mockReturnValue(new Uint8Array()),
          addSignature: jest.fn(),
          toJSON: jest.fn().mockReturnValue({})
        }

        const transaction: AvalancheTransactionRequest = {
          tx: mockTx as unknown as AvalancheTransactionRequest['tx']
        }

        await expect(
          ledgerWallet.signAvalancheTransaction({
            accountIndex: 0,
            transaction,
            network: mockNetwork,
            provider: mockProvider
          })
        ).rejects.toThrow('Unsupported VM type: UNKNOWN_VM')
      })
    })

    describe('C-chain derivation paths', () => {
      it('should use account 0 path for C-chain with account index 0', async () => {
        const transaction: AvalancheTransactionRequest = {
          tx: createCChainTx() as unknown as AvalancheTransactionRequest['tx']
        }

        await ledgerWallet.signAvalancheTransaction({
          accountIndex: 0,
          transaction,
          network: mockNetwork,
          provider: mockProvider
        })

        expect(mockSign).toHaveBeenCalledWith(
          "m/44'/60'/0'", // Account 0
          ['0/0'], // Always first address
          expect.any(Buffer),
          undefined
        )
      })

      it('should use account 1 path for C-chain with account index 1', async () => {
        const transaction: AvalancheTransactionRequest = {
          tx: createCChainTx() as unknown as AvalancheTransactionRequest['tx']
        }

        await ledgerWallet.signAvalancheTransaction({
          accountIndex: 1,
          transaction,
          network: mockNetwork,
          provider: mockProvider
        })

        expect(mockSign).toHaveBeenCalledWith(
          "m/44'/60'/1'", // Account 1
          ['0/0'], // Always first address
          expect.any(Buffer),
          undefined
        )
      })

      it('should use account 2 path for C-chain with account index 2', async () => {
        const transaction: AvalancheTransactionRequest = {
          tx: createCChainTx() as unknown as AvalancheTransactionRequest['tx']
        }

        await ledgerWallet.signAvalancheTransaction({
          accountIndex: 2,
          transaction,
          network: mockNetwork,
          provider: mockProvider
        })

        expect(mockSign).toHaveBeenCalledWith(
          "m/44'/60'/2'", // Account 2
          ['0/0'], // Always first address
          expect.any(Buffer),
          undefined
        )
      })

      it('should always use 0/0 signing path for C-chain regardless of account index', async () => {
        const transaction: AvalancheTransactionRequest = {
          tx: createCChainTx() as unknown as AvalancheTransactionRequest['tx']
        }

        // Test with account 5
        await ledgerWallet.signAvalancheTransaction({
          accountIndex: 5,
          transaction,
          network: mockNetwork,
          provider: mockProvider
        })

        expect(mockSign).toHaveBeenCalledWith(
          "m/44'/60'/5'", // Account 5
          ['0/0'], // Still 0/0, not 0/5
          expect.any(Buffer),
          undefined
        )
      })

      it('should ignore externalIndices for C-chain transactions', async () => {
        const transaction: AvalancheTransactionRequest = {
          tx: createCChainTx() as unknown as AvalancheTransactionRequest['tx'],
          externalIndices: [3, 5, 7] // Should be ignored for C-chain
        }

        await ledgerWallet.signAvalancheTransaction({
          accountIndex: 0,
          transaction,
          network: mockNetwork,
          provider: mockProvider
        })

        expect(mockSign).toHaveBeenCalledWith(
          "m/44'/60'/0'",
          ['0/0'], // Not ['0/3', '0/5', '0/7']
          expect.any(Buffer),
          undefined
        )
      })
    })

    describe('X/P-chain derivation paths', () => {
      it('should use account index in X-chain account path', async () => {
        const transaction: AvalancheTransactionRequest = {
          tx: createXChainTx() as unknown as AvalancheTransactionRequest['tx'],
          externalIndices: [0]
        }

        await ledgerWallet.signAvalancheTransaction({
          accountIndex: 2,
          transaction,
          network: mockNetwork,
          provider: mockProvider
        })

        expect(mockSign).toHaveBeenCalledWith(
          "m/44'/9000'/2'", // Account 2
          ['0/0'],
          expect.any(Buffer),
          undefined
        )
      })

      it('should use account index in P-chain account path', async () => {
        const transaction: AvalancheTransactionRequest = {
          tx: createPChainTx() as unknown as AvalancheTransactionRequest['tx'],
          externalIndices: [0]
        }

        await ledgerWallet.signAvalancheTransaction({
          accountIndex: 3,
          transaction,
          network: mockNetwork,
          provider: mockProvider
        })

        expect(mockSign).toHaveBeenCalledWith(
          "m/44'/9000'/3'", // Account 3
          ['0/0'],
          expect.any(Buffer),
          undefined
        )
      })

      it('should map external indices to signing paths for X-chain', async () => {
        const transaction: AvalancheTransactionRequest = {
          tx: createXChainTx() as unknown as AvalancheTransactionRequest['tx'],
          externalIndices: [3, 5, 7]
        }

        await ledgerWallet.signAvalancheTransaction({
          accountIndex: 0,
          transaction,
          network: mockNetwork,
          provider: mockProvider
        })

        expect(mockSign).toHaveBeenCalledWith(
          "m/44'/9000'/0'",
          ['0/3', '0/5', '0/7'], // Multiple UTXO signing paths
          expect.any(Buffer),
          undefined
        )
      })

      it('should default to [0/0] when externalIndices is empty array for X-chain', async () => {
        const transaction: AvalancheTransactionRequest = {
          tx: createXChainTx() as unknown as AvalancheTransactionRequest['tx'],
          externalIndices: []
        }

        await ledgerWallet.signAvalancheTransaction({
          accountIndex: 0,
          transaction,
          network: mockNetwork,
          provider: mockProvider
        })

        expect(mockSign).toHaveBeenCalledWith(
          "m/44'/9000'/0'",
          ['0/0'], // Default fallback
          expect.any(Buffer),
          undefined
        )
      })

      it('should default to [0/0] when externalIndices is undefined for X-chain', async () => {
        const transaction: AvalancheTransactionRequest = {
          tx: createXChainTx() as unknown as AvalancheTransactionRequest['tx']
          // externalIndices not provided
        }

        await ledgerWallet.signAvalancheTransaction({
          accountIndex: 0,
          transaction,
          network: mockNetwork,
          provider: mockProvider
        })

        expect(mockSign).toHaveBeenCalledWith(
          "m/44'/9000'/0'",
          ['0/0'], // Default fallback
          expect.any(Buffer),
          undefined
        )
      })

      it('should handle single external index for P-chain', async () => {
        const transaction: AvalancheTransactionRequest = {
          tx: createPChainTx() as unknown as AvalancheTransactionRequest['tx'],
          externalIndices: [2]
        }

        await ledgerWallet.signAvalancheTransaction({
          accountIndex: 0,
          transaction,
          network: mockNetwork,
          provider: mockProvider
        })

        expect(mockSign).toHaveBeenCalledWith(
          "m/44'/9000'/0'",
          ['0/2'],
          expect.any(Buffer),
          undefined
        )
      })
    })

    describe('internal indices / change paths', () => {
      it('should map internal indices to change paths', async () => {
        const transaction: AvalancheTransactionRequest = {
          tx: createXChainTx() as unknown as AvalancheTransactionRequest['tx'],
          externalIndices: [0],
          internalIndices: [1, 3]
        }

        await ledgerWallet.signAvalancheTransaction({
          accountIndex: 0,
          transaction,
          network: mockNetwork,
          provider: mockProvider
        })

        expect(mockSign).toHaveBeenCalledWith(
          "m/44'/9000'/0'",
          ['0/0'],
          expect.any(Buffer),
          ['1/1', '1/3'] // Change paths
        )
      })

      it('should not include change paths when internalIndices is empty', async () => {
        const transaction: AvalancheTransactionRequest = {
          tx: createXChainTx() as unknown as AvalancheTransactionRequest['tx'],
          externalIndices: [0],
          internalIndices: []
        }

        await ledgerWallet.signAvalancheTransaction({
          accountIndex: 0,
          transaction,
          network: mockNetwork,
          provider: mockProvider
        })

        expect(mockSign).toHaveBeenCalledWith(
          "m/44'/9000'/0'",
          ['0/0'],
          expect.any(Buffer),
          undefined // No change paths
        )
      })

      it('should not include change paths when internalIndices is undefined', async () => {
        const transaction: AvalancheTransactionRequest = {
          tx: createXChainTx() as unknown as AvalancheTransactionRequest['tx'],
          externalIndices: [0]
          // internalIndices not provided
        }

        await ledgerWallet.signAvalancheTransaction({
          accountIndex: 0,
          transaction,
          network: mockNetwork,
          provider: mockProvider
        })

        expect(mockSign).toHaveBeenCalledWith(
          "m/44'/9000'/0'",
          ['0/0'],
          expect.any(Buffer),
          undefined // No change paths
        )
      })
    })

    describe('signature handling', () => {
      it('should add signatures to transaction', async () => {
        const mockSignature1 = Buffer.from('signature1')
        const mockSignature2 = Buffer.from('signature2')
        const mockSignatures = new Map([
          ['path1', mockSignature1],
          ['path2', mockSignature2]
        ])

        mockSign.mockResolvedValue({
          signatures: mockSignatures
        })

        const addSignatureSpy = jest.fn()
        const mockTx = {
          getVM: jest.fn().mockReturnValue('AVM'),
          toBytes: jest.fn().mockReturnValue(new Uint8Array()),
          addSignature: addSignatureSpy,
          toJSON: jest.fn().mockReturnValue({})
        }

        const transaction: AvalancheTransactionRequest = {
          tx: mockTx as unknown as AvalancheTransactionRequest['tx'],
          externalIndices: [0, 1]
        }

        await ledgerWallet.signAvalancheTransaction({
          accountIndex: 0,
          transaction,
          network: mockNetwork,
          provider: mockProvider
        })

        expect(addSignatureSpy).toHaveBeenCalledTimes(2)
        expect(addSignatureSpy).toHaveBeenCalledWith(mockSignature1)
        expect(addSignatureSpy).toHaveBeenCalledWith(mockSignature2)
      })

      it('should return JSON stringified transaction', async () => {
        const mockTxJSON = { codecId: '0', vm: 'AVM', txBytes: '0x123' }
        const mockTx = {
          getVM: jest.fn().mockReturnValue('AVM'),
          toBytes: jest.fn().mockReturnValue(new Uint8Array()),
          addSignature: jest.fn(),
          toJSON: jest.fn().mockReturnValue(mockTxJSON)
        }

        const transaction: AvalancheTransactionRequest = {
          tx: mockTx as unknown as AvalancheTransactionRequest['tx'],
          externalIndices: [0]
        }

        const result = await ledgerWallet.signAvalancheTransaction({
          accountIndex: 0,
          transaction,
          network: mockNetwork,
          provider: mockProvider
        })

        expect(result).toBe(JSON.stringify(mockTxJSON))
      })
    })

    describe('error handling', () => {
      it('should throw error when connection fails', async () => {
        mockEnsureConnection.mockRejectedValueOnce(
          new Error('DisconnectedDevice')
        )

        const mockTx = {
          getVM: jest.fn().mockReturnValue('AVM'),
          toBytes: jest.fn().mockReturnValue(new Uint8Array()),
          addSignature: jest.fn(),
          toJSON: jest.fn().mockReturnValue({})
        }

        const transaction: AvalancheTransactionRequest = {
          tx: mockTx as unknown as AvalancheTransactionRequest['tx'],
          externalIndices: [0]
        }

        await expect(
          ledgerWallet.signAvalancheTransaction({
            accountIndex: 0,
            transaction,
            network: mockNetwork,
            provider: mockProvider
          })
        ).rejects.toThrow(
          'Ledger device disconnected. Please ensure your Ledger device is nearby and Bluetooth is enabled.'
        )
      })

      it('should throw error when Avalanche app is not ready', async () => {
        mockWaitForApp.mockRejectedValueOnce(new Error('0x6a86'))

        const mockTx = {
          getVM: jest.fn().mockReturnValue('AVM'),
          toBytes: jest.fn().mockReturnValue(new Uint8Array()),
          addSignature: jest.fn(),
          toJSON: jest.fn().mockReturnValue({})
        }

        const transaction: AvalancheTransactionRequest = {
          tx: mockTx as unknown as AvalancheTransactionRequest['tx'],
          externalIndices: [0]
        }

        await expect(
          ledgerWallet.signAvalancheTransaction({
            accountIndex: 0,
            transaction,
            network: mockNetwork,
            provider: mockProvider
          })
        ).rejects.toThrow(
          'Avalanche app not ready. Please ensure the Avalanche app is open and ready.'
        )
      })

      it('should throw error when signing fails', async () => {
        mockSign.mockRejectedValue(new Error('0x6985'))

        const mockTx = {
          getVM: jest.fn().mockReturnValue('AVM'),
          toBytes: jest.fn().mockReturnValue(new Uint8Array()),
          addSignature: jest.fn(),
          toJSON: jest.fn().mockReturnValue({})
        }

        const transaction: AvalancheTransactionRequest = {
          tx: mockTx as unknown as AvalancheTransactionRequest['tx'],
          externalIndices: [0]
        }

        await expect(
          ledgerWallet.signAvalancheTransaction({
            accountIndex: 0,
            transaction,
            network: mockNetwork,
            provider: mockProvider
          })
        ).rejects.toThrow('Transaction rejected by user on Ledger device.')
      })
    })

    describe('Ledger service integration', () => {
      it('should open Avalanche app before signing', async () => {
        mockOpenApp.mockClear()

        const mockTx = {
          getVM: jest.fn().mockReturnValue('AVM'),
          toBytes: jest.fn().mockReturnValue(new Uint8Array()),
          addSignature: jest.fn(),
          toJSON: jest.fn().mockReturnValue({})
        }

        const transaction: AvalancheTransactionRequest = {
          tx: mockTx as unknown as AvalancheTransactionRequest['tx'],
          externalIndices: [0]
        }

        await ledgerWallet.signAvalancheTransaction({
          accountIndex: 0,
          transaction,
          network: mockNetwork,
          provider: mockProvider
        })

        expect(mockOpenApp).toHaveBeenCalledWith(LedgerAppType.AVALANCHE)
      })

      it('should ensure connection before signing', async () => {
        mockEnsureConnection.mockClear()

        const mockTx = {
          getVM: jest.fn().mockReturnValue('AVM'),
          toBytes: jest.fn().mockReturnValue(new Uint8Array()),
          addSignature: jest.fn(),
          toJSON: jest.fn().mockReturnValue({})
        }

        const transaction: AvalancheTransactionRequest = {
          tx: mockTx as unknown as AvalancheTransactionRequest['tx'],
          externalIndices: [0]
        }

        await ledgerWallet.signAvalancheTransaction({
          accountIndex: 0,
          transaction,
          network: mockNetwork,
          provider: mockProvider
        })

        expect(mockEnsureConnection).toHaveBeenCalledWith(mockDeviceId)
      })

      it('should wait for Avalanche app before signing', async () => {
        mockWaitForApp.mockClear()

        const mockTx = {
          getVM: jest.fn().mockReturnValue('AVM'),
          toBytes: jest.fn().mockReturnValue(new Uint8Array()),
          addSignature: jest.fn(),
          toJSON: jest.fn().mockReturnValue({})
        }

        const transaction: AvalancheTransactionRequest = {
          tx: mockTx as unknown as AvalancheTransactionRequest['tx'],
          externalIndices: [0]
        }

        await ledgerWallet.signAvalancheTransaction({
          accountIndex: 0,
          transaction,
          network: mockNetwork,
          provider: mockProvider
        })

        expect(mockWaitForApp).toHaveBeenCalledWith(
          LedgerAppType.AVALANCHE,
          expect.any(Number)
        )
      })
    })
  })

  // ========================================
  // Private Methods Tests
  // ========================================

  describe('Private Methods', () => {
    describe('getTransport', () => {
      it('should call LedgerService.ensureConnection with deviceId', async () => {
        // Remove the spy set up in beforeEach
        jest.restoreAllMocks()

        const mockTransport = new MockTransport()
        mockEnsureConnection.mockResolvedValue(mockTransport as never)

        // Access private method using bracket notation
        const result = await (ledgerWallet as any).getTransport()

        expect(mockEnsureConnection).toHaveBeenCalledWith(mockDeviceId)
        expect(result).toBe(mockTransport)
      })

      it('should throw error when connection fails', async () => {
        // Remove the spy set up in beforeEach
        jest.restoreAllMocks()

        mockEnsureConnection.mockRejectedValue(new Error('Connection failed'))

        await expect((ledgerWallet as any).getTransport()).rejects.toThrow(
          'Connection failed'
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
      beforeEach(() => {
        mockSignMsg.mockResolvedValue({
          signatures: new Map([['key', Buffer.from('mock-signature', 'hex')]])
        })
      })

      it('should sign Avalanche message with correct derivation path', async () => {
        const message = 'Test message'
        const result = await (ledgerWallet as any).signAvalancheMessage(
          0,
          message
        )

        expect(mockSignMsg).toHaveBeenCalledWith(
          "m/44'/9000'/0'",
          ['0/0'],
          message
        )
        expect(typeof result).toBe('string')
      })

      it('should use correct account index in derivation path', async () => {
        const message = 'Test message'
        await (ledgerWallet as any).signAvalancheMessage(2, message)

        expect(mockSignMsg).toHaveBeenCalledWith(
          "m/44'/9000'/2'",
          ['0/0'],
          message
        )
      })

      it('should stringify non-string data', async () => {
        const data = { foo: 'bar', num: 123 }
        await (ledgerWallet as any).signAvalancheMessage(0, data)

        expect(mockSignMsg).toHaveBeenCalledWith(
          "m/44'/9000'/0'",
          ['0/0'],
          JSON.stringify(data)
        )
      })

      it('should throw error when no signatures returned', async () => {
        mockSignMsg.mockResolvedValue({ signatures: new Map() })

        await expect(
          (ledgerWallet as any).signAvalancheMessage(0, 'message')
        ).rejects.toThrow('No signatures returned from device')
      })

      it('should handle app connection errors', async () => {
        mockEnsureConnection.mockRejectedValue(new Error('Connection failed'))

        await expect(
          (ledgerWallet as any).signAvalancheMessage(0, 'message')
        ).rejects.toThrow('Connection failed')
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

    describe('signEIP712WithFallback', () => {
      const mockEIP712Message = {
        domain: { name: 'Test', version: '1' },
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' }
          ],
          Message: [{ name: 'content', type: 'string' }]
        },
        primaryType: 'Message',
        message: { content: 'Hello' }
      }

      it('should use signEIP712Message when supported', async () => {
        mockEthSignEIP712Message.mockResolvedValue({
          r: '1234567890abcdef',
          s: 'fedcba0987654321',
          v: 27
        })

        // Create mock app object with signEIP712Message method
        const mockApp = {
          signEIP712Message: mockEthSignEIP712Message,
          signEIP712HashedMessage: mockEthSignEIP712HashedMessage
        }

        const result = await (ledgerWallet as any).signEIP712WithFallback(
          mockApp,
          "m/44'/60'/0'/0/0",
          mockEIP712Message
        )

        expect(mockEthSignEIP712Message).toHaveBeenCalledWith(
          "m/44'/60'/0'/0/0",
          mockEIP712Message
        )
        expect(result).toMatch(/^0x[0-9a-f]{130}$/i) // 0x + 64 chars (r) + 64 chars (s) + 2 chars (v)
      })

      it('should fallback to signEIP712HashedMessage for Nano S (INS_NOT_SUPPORTED 0x6d00)', async () => {
        mockEthSignEIP712Message.mockRejectedValue(
          new Error('Ledger device: UNKNOWN_ERROR (0x6d00)')
        )
        mockEthSignEIP712HashedMessage.mockResolvedValue({
          r: '1234567890abcdef',
          s: 'fedcba0987654321',
          v: 28
        })

        const mockApp = {
          signEIP712Message: mockEthSignEIP712Message,
          signEIP712HashedMessage: mockEthSignEIP712HashedMessage
        }

        const result = await (ledgerWallet as any).signEIP712WithFallback(
          mockApp,
          "m/44'/60'/0'/0/0",
          mockEIP712Message
        )

        expect(mockEthSignEIP712Message).toHaveBeenCalled()
        expect(mockEthSignEIP712HashedMessage).toHaveBeenCalled()
        expect(result).toMatch(/^0x[0-9a-f]{130}$/i)
      })

      it('should fallback to signEIP712HashedMessage when method not supported', async () => {
        mockEthSignEIP712Message.mockRejectedValue(
          new Error('Method not supported')
        )
        mockEthSignEIP712HashedMessage.mockResolvedValue({
          r: '1234567890abcdef',
          s: 'fedcba0987654321',
          v: 28
        })

        const mockApp = {
          signEIP712Message: mockEthSignEIP712Message,
          signEIP712HashedMessage: mockEthSignEIP712HashedMessage
        }

        await (ledgerWallet as any).signEIP712WithFallback(
          mockApp,
          "m/44'/60'/0'/0/0",
          mockEIP712Message
        )

        expect(mockEthSignEIP712HashedMessage).toHaveBeenCalled()
      })

      it('should rethrow user-rejection errors without triggering fallback', async () => {
        mockEthSignEIP712Message.mockRejectedValue(
          new Error('Ledger device: Conditions of use not satisfied (0x6985)')
        )

        const mockApp = {
          signEIP712Message: mockEthSignEIP712Message,
          signEIP712HashedMessage: mockEthSignEIP712HashedMessage
        }

        await expect(
          (ledgerWallet as any).signEIP712WithFallback(
            mockApp,
            "m/44'/60'/0'/0/0",
            mockEIP712Message
          )
        ).rejects.toThrow('0x6985')

        expect(mockEthSignEIP712HashedMessage).not.toHaveBeenCalled()
      })

      it('should rethrow unknown errors without triggering fallback', async () => {
        mockEthSignEIP712Message.mockRejectedValue(
          new Error('Unexpected device error')
        )

        const mockApp = {
          signEIP712Message: mockEthSignEIP712Message,
          signEIP712HashedMessage: mockEthSignEIP712HashedMessage
        }

        await expect(
          (ledgerWallet as any).signEIP712WithFallback(
            mockApp,
            "m/44'/60'/0'/0/0",
            mockEIP712Message
          )
        ).rejects.toThrow('Unexpected device error')

        expect(mockEthSignEIP712HashedMessage).not.toHaveBeenCalled()
      })

      it('should use TypedDataEncoder.hashStruct with explicit primaryType in fallback', async () => {
        mockEthSignEIP712Message.mockRejectedValue(
          new Error('Ledger device: UNKNOWN_ERROR (0x6d00)')
        )
        mockEthSignEIP712HashedMessage.mockResolvedValue({
          r: '1234567890abcdef',
          s: 'fedcba0987654321',
          v: 28
        })

        const mockApp = {
          signEIP712Message: mockEthSignEIP712Message,
          signEIP712HashedMessage: mockEthSignEIP712HashedMessage
        }

        // Should not throw "ambiguous primary types" even when type keys are
        // in an arbitrary insertion order, because we pass primaryType explicitly
        await expect(
          (ledgerWallet as any).signEIP712WithFallback(
            mockApp,
            "m/44'/60'/0'/0/0",
            mockEIP712Message
          )
        ).resolves.toMatch(/^0x/)
      })

      it('should pad signature components correctly', async () => {
        mockEthSignEIP712Message.mockResolvedValue({
          r: '1',
          s: '2',
          v: 27
        })

        const mockApp = {
          signEIP712Message: mockEthSignEIP712Message,
          signEIP712HashedMessage: mockEthSignEIP712HashedMessage
        }

        const result = await (ledgerWallet as any).signEIP712WithFallback(
          mockApp,
          "m/44'/60'/0'/0/0",
          mockEIP712Message
        )

        // Should pad r and s to 64 chars, v to 2 chars
        expect(result).toBe(
          '0x' +
            '0000000000000000000000000000000000000000000000000000000000000001' + // r padded
            '0000000000000000000000000000000000000000000000000000000000000002' + // s padded
            '1b' // v = 27 = 0x1b
        )
      })
    })

    describe('isDeviceCapabilityError', () => {
      it('should return true for INS_NOT_SUPPORTED status (0x6d00)', () => {
        const err = new Error('Ledger device: UNKNOWN_ERROR (0x6d00)')
        expect((ledgerWallet as any).isDeviceCapabilityError(err)).toBe(true)
      })

      it('should return true for CLA_NOT_SUPPORTED status (0x6e00)', () => {
        const err = new Error('Ledger device: CLA_NOT_SUPPORTED (0x6e00)')
        expect((ledgerWallet as any).isDeviceCapabilityError(err)).toBe(true)
      })

      it('should return false for unrelated errors', () => {
        const err = new Error('Unexpected device error')
        expect((ledgerWallet as any).isDeviceCapabilityError(err)).toBe(false)
      })

      it('should return false for non-Error values', () => {
        expect((ledgerWallet as any).isDeviceCapabilityError('string')).toBe(
          false
        )
        expect((ledgerWallet as any).isDeviceCapabilityError(null)).toBe(false)
        expect((ledgerWallet as any).isDeviceCapabilityError(42)).toBe(false)
      })
    })

    describe('getCChainSignature', () => {
      beforeEach(() => {
        mockGetETHAddress.mockResolvedValue({ address: '0x123...' })
        mockSignEVMTransaction.mockResolvedValue({
          r: 'aaaa',
          s: 'bbbb',
          v: '1c'
        })
      })

      it('should sign with Avalanche app', async () => {
        const mockTransport = new MockTransport()
        const result = await (ledgerWallet as any).getCChainSignature({
          transport: mockTransport,
          derivationPath: "m/44'/60'/0'/0/0",
          unsignedTx: 'abcdef123456'
        })

        expect(mockGetETHAddress).toHaveBeenCalledWith("m/44'/60'/0'/0/0")
        expect(mockSignEVMTransaction).toHaveBeenCalledWith(
          "m/44'/60'/0'/0/0",
          'abcdef123456',
          expect.objectContaining({
            externalPlugin: [],
            erc20Tokens: [],
            nfts: [],
            plugin: [],
            domains: []
          })
        )
        expect(result).toEqual({
          r: 'aaaa',
          s: 'bbbb',
          v: '1c'
        })
      })

      it('should throw error when signature is undefined', async () => {
        mockSignEVMTransaction.mockResolvedValue(undefined)

        const mockTransport = new MockTransport()

        await expect(
          (ledgerWallet as any).getCChainSignature({
            transport: mockTransport,
            derivationPath: "m/44'/60'/0'/0/0",
            unsignedTx: 'abcdef'
          })
        ).rejects.toThrow('signEVMTransaction returned undefined')
      })
    })

    describe('getEvmSignature', () => {
      beforeEach(() => {
        mockEthGetAddress.mockResolvedValue({ address: '0x456...' })
        mockEthSignTransaction.mockResolvedValue({
          r: 'cccc',
          s: 'dddd',
          v: '1b'
        })
      })

      it('should sign with Ethereum app', async () => {
        const mockTransport = new MockTransport()
        const result = await (ledgerWallet as any).getEvmSignature({
          transport: mockTransport,
          derivationPath: "m/44'/60'/0'/0/0",
          unsignedTx: 'fedcba987654'
        })

        expect(mockEthGetAddress).toHaveBeenCalledWith("m/44'/60'/0'/0/0")
        expect(mockEthSignTransaction).toHaveBeenCalledWith(
          "m/44'/60'/0'/0/0",
          'fedcba987654'
        )
        expect(result).toEqual({
          r: 'cccc',
          s: 'dddd',
          v: '1b'
        })
      })

      it('should throw error when signature is undefined', async () => {
        mockEthSignTransaction.mockResolvedValue(undefined)

        const mockTransport = new MockTransport()

        await expect(
          (ledgerWallet as any).getEvmSignature({
            transport: mockTransport,
            derivationPath: "m/44'/60'/0'/0/0",
            unsignedTx: 'abcdef'
          })
        ).rejects.toThrow('signTransaction returned undefined')
      })
    })

    describe('handleAppConnection', () => {
      it('should ensure connection and wait for app', async () => {
        await (ledgerWallet as any).handleAppConnection(LedgerAppType.AVALANCHE)

        expect(mockEnsureConnection).toHaveBeenCalledWith(mockDeviceId)
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
        mockEnsureConnection.mockRejectedValue(new Error('Device not found'))

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
          mockPublicKeys,
          0
        )
        expect(
          BitcoinWalletPolicyService.findBtcWalletPolicyInPublicKeys
        ).toHaveBeenCalledWith(mockPublicKeys, 0)
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

    describe('getHexSignature', () => {
      it('should format signature into 0x-prefixed hex string', () => {
        const result = (ledgerWallet as any).getHexSignature({
          r: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          s: 'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
          v: 27
        })

        expect(result).toMatch(/^0x[0-9a-f]{130}$/i)
      })

      it('should pad r and s to 64 characters', () => {
        const result = (ledgerWallet as any).getHexSignature({
          r: '1',
          s: '2',
          v: 27
        })

        expect(result).toBe(
          '0x' +
            '0000000000000000000000000000000000000000000000000000000000000001' + // r padded to 64
            '0000000000000000000000000000000000000000000000000000000000000002' + // s padded to 64
            '1b' // v = 27 = 0x1b
        )
      })

      it('should convert v to 2-character hex', () => {
        const result = (ledgerWallet as any).getHexSignature({
          r: '0'.repeat(64),
          s: '0'.repeat(64),
          v: 28
        })

        expect(result).toMatch(/1c$/) // v = 28 = 0x1c
      })
    })

    describe('handleEthAndPersonalSign', () => {
      const derivationPath = "m/44'/60'/0'/0/0"

      beforeEach(() => {
        mockEthSignPersonalMessage.mockResolvedValue({
          r: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          s: 'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
          v: 27
        })
      })

      it('should sign a plain string message using Ethereum app', async () => {
        const result = await (ledgerWallet as any).handleEthAndPersonalSign({
          data: 'hello world',
          derivationPath
        })

        const expectedHex = Buffer.from('hello world', 'utf8').toString('hex')
        expect(mockEthSignPersonalMessage).toHaveBeenCalledWith(
          derivationPath,
          expectedHex
        )
        expect(result).toMatch(/^0x/)
      })

      it('should strip 0x prefix from hex-encoded string data', async () => {
        await (ledgerWallet as any).handleEthAndPersonalSign({
          data: '0xdeadbeef',
          derivationPath
        })

        expect(mockEthSignPersonalMessage).toHaveBeenCalledWith(
          derivationPath,
          'deadbeef'
        )
      })

      it('should stringify non-string data before signing', async () => {
        const objData = { foo: 'bar', num: 42 }
        await (ledgerWallet as any).handleEthAndPersonalSign({
          data: objData,
          derivationPath
        })

        const expectedHex = Buffer.from(
          JSON.stringify(objData),
          'utf8'
        ).toString('hex')
        expect(mockEthSignPersonalMessage).toHaveBeenCalledWith(
          derivationPath,
          expectedHex
        )
      })

      it('should return hex-formatted signature', async () => {
        mockEthSignPersonalMessage.mockResolvedValue({ r: '1', s: '2', v: 27 })

        const result = await (ledgerWallet as any).handleEthAndPersonalSign({
          data: 'test',
          derivationPath
        })

        expect(result).toBe(
          '0x' +
            '0000000000000000000000000000000000000000000000000000000000000001' +
            '0000000000000000000000000000000000000000000000000000000000000002' +
            '1b'
        )
      })

      it('should throw when app connection fails', async () => {
        mockEnsureConnection.mockRejectedValueOnce(new Error('No device'))

        await expect(
          (ledgerWallet as any).handleEthAndPersonalSign({
            data: 'hello',
            derivationPath
          })
        ).rejects.toThrow('No device')
      })
    })

    describe('handleSignedTypedData', () => {
      const derivationPath = "m/44'/60'/0'/0/0"
      const ethChainId = 1
      const avaxChainId = 43114

      const validTypedData = {
        domain: { name: 'Test App', version: '1' },
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' }
          ],
          Message: [{ name: 'content', type: 'string' }]
        },
        primaryType: 'Message',
        message: { content: 'Hello' }
      }

      beforeEach(() => {
        mockEthSignEIP712Message.mockResolvedValue({
          r: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          s: 'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
          v: 27
        })
        mockAvaxSignEIP712Message.mockResolvedValue({
          r: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          s: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
          v: 28
        })
      })

      it('should throw for v1 array format data', async () => {
        await expect(
          (ledgerWallet as any).handleSignedTypedData({
            data: [{ name: 'test', type: 'string', value: 'hello' }],
            rpcMethod: RpcMethod.SIGN_TYPED_DATA,
            derivationPath,
            chainId: ethChainId
          })
        ).rejects.toThrow(
          'eth_signTypedData v1 is not supported on Ledger devices.'
        )
      })

      it('should throw for v1 JSON array string', async () => {
        await expect(
          (ledgerWallet as any).handleSignedTypedData({
            data: '[{"name":"test","type":"string","value":"hello"}]',
            rpcMethod: RpcMethod.SIGN_TYPED_DATA,
            derivationPath,
            chainId: ethChainId
          })
        ).rejects.toThrow(
          'eth_signTypedData v1 is not supported on Ledger devices.'
        )
      })

      it('should throw when rpcMethod is SIGN_TYPED_DATA_V1', async () => {
        await expect(
          (ledgerWallet as any).handleSignedTypedData({
            data: validTypedData,
            rpcMethod: RpcMethod.SIGN_TYPED_DATA_V1,
            derivationPath,
            chainId: ethChainId
          })
        ).rejects.toThrow(
          'eth_signTypedData v1 is not supported on Ledger devices.'
        )
      })

      it('should sign EIP-712 typed data object with Ethereum app', async () => {
        const result = await (ledgerWallet as any).handleSignedTypedData({
          data: validTypedData,
          rpcMethod: RpcMethod.SIGN_TYPED_DATA_V4,
          derivationPath,
          chainId: ethChainId
        })

        expect(mockEthSignEIP712Message).toHaveBeenCalledWith(
          derivationPath,
          expect.objectContaining({ primaryType: 'Message' })
        )
        expect(result).toMatch(/^0x/)
      })

      it('should sign EIP-712 data passed as JSON string', async () => {
        const result = await (ledgerWallet as any).handleSignedTypedData({
          data: JSON.stringify(validTypedData),
          rpcMethod: RpcMethod.SIGN_TYPED_DATA_V4,
          derivationPath,
          chainId: ethChainId
        })

        expect(mockEthSignEIP712Message).toHaveBeenCalled()
        expect(result).toMatch(/^0x/)
      })

      it('should throw when JSON string is invalid', async () => {
        await expect(
          (ledgerWallet as any).handleSignedTypedData({
            data: 'not-valid-json',
            rpcMethod: RpcMethod.SIGN_TYPED_DATA_V4,
            derivationPath,
            chainId: ethChainId
          })
        ).rejects.toThrow(
          'Invalid typed data format: expected JSON string or object'
        )
      })

      it('should throw when domain is missing', async () => {
        const { domain: _domain, ...dataWithoutDomain } = validTypedData
        await expect(
          (ledgerWallet as any).handleSignedTypedData({
            data: dataWithoutDomain,
            rpcMethod: RpcMethod.SIGN_TYPED_DATA_V4,
            derivationPath,
            chainId: ethChainId
          })
        ).rejects.toThrow('TypedData missing required field: domain')
      })

      it('should throw when types is missing', async () => {
        const { types: _types, ...dataWithoutTypes } = validTypedData
        await expect(
          (ledgerWallet as any).handleSignedTypedData({
            data: dataWithoutTypes,
            rpcMethod: RpcMethod.SIGN_TYPED_DATA_V4,
            derivationPath,
            chainId: ethChainId
          })
        ).rejects.toThrow('TypedData missing required field: types')
      })

      it('should throw when primaryType is missing', async () => {
        const { primaryType: _primaryType, ...dataWithoutPrimary } =
          validTypedData
        await expect(
          (ledgerWallet as any).handleSignedTypedData({
            data: dataWithoutPrimary,
            rpcMethod: RpcMethod.SIGN_TYPED_DATA_V4,
            derivationPath,
            chainId: ethChainId
          })
        ).rejects.toThrow('TypedData missing required field: primaryType')
      })

      it('should throw when message is missing', async () => {
        const { message: _message, ...dataWithoutMessage } = validTypedData
        await expect(
          (ledgerWallet as any).handleSignedTypedData({
            data: dataWithoutMessage,
            rpcMethod: RpcMethod.SIGN_TYPED_DATA_V4,
            derivationPath,
            chainId: ethChainId
          })
        ).rejects.toThrow('TypedData missing required field: message')
      })

      it('should use Avalanche app for Avalanche chain IDs', async () => {
        ;(isAvalancheChainId as jest.Mock).mockReturnValue(true)

        await (ledgerWallet as any).handleSignedTypedData({
          data: validTypedData,
          rpcMethod: RpcMethod.SIGN_TYPED_DATA_V4,
          derivationPath,
          chainId: avaxChainId
        })

        expect(mockAvaxSignEIP712Message).toHaveBeenCalledWith(
          derivationPath,
          expect.objectContaining({ primaryType: 'Message' })
        )
        expect(mockEthSignEIP712Message).not.toHaveBeenCalled()
      })

      it('should use Ethereum app for non-Avalanche chain IDs', async () => {
        await (ledgerWallet as any).handleSignedTypedData({
          data: validTypedData,
          rpcMethod: RpcMethod.SIGN_TYPED_DATA_V4,
          derivationPath,
          chainId: ethChainId
        })

        expect(mockEthSignEIP712Message).toHaveBeenCalled()
        expect(mockAvaxSignEIP712Message).not.toHaveBeenCalled()
      })
    })
  })
})
