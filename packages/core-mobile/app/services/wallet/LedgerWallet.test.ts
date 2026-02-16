import { Network } from '@avalabs/core-chains-sdk'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { Curve } from 'utils/publicKeys'
import { LedgerAppType, LedgerDerivationPathType } from 'services/ledger/types'
import { AvalancheTransactionRequest } from './types'

// Mock dependencies
jest.mock('utils/api/generated/profileApi.client', () => ({
  postV1GetAddresses: jest.fn()
}), { virtual: true })
jest.mock('utils/api/clients/profileApiClient', () => ({
  profileApiClient: {}
}), { virtual: true })

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

jest.mock('@avalabs/hw-app-avalanche', () => {
  // Create mock class inside the factory function
  return {
    __esModule: true,
    default: class MockAvalancheApp {
      sign = mockSign
      constructor(_transport: any) {
        // Constructor accepts transport but doesn't use it
      }
    }
  }
})

// Import after mocking
import { LedgerWallet } from './LedgerWallet'
import LedgerService from 'services/ledger/LedgerService'

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
          tx: mockTx as any,
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
          tx: mockTx as any,
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
          tx: mockTx as any
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
          tx: mockTx as any
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
          tx: createCChainTx() as any
        }

        await ledgerWallet.signAvalancheTransaction({
          accountIndex: 0,
          transaction,
          network: mockNetwork,
          provider: mockProvider
        })

        expect(mockSign).toHaveBeenCalledWith(
          "m/44'/60'/0'",  // Account 0
          ['0/0'],          // Always first address
          expect.any(Buffer),
          undefined
        )
      })

      it('should use account 1 path for C-chain with account index 1', async () => {
        const transaction: AvalancheTransactionRequest = {
          tx: createCChainTx() as any
        }

        await ledgerWallet.signAvalancheTransaction({
          accountIndex: 1,
          transaction,
          network: mockNetwork,
          provider: mockProvider
        })

        expect(mockSign).toHaveBeenCalledWith(
          "m/44'/60'/1'",  // Account 1
          ['0/0'],          // Always first address
          expect.any(Buffer),
          undefined
        )
      })

      it('should use account 2 path for C-chain with account index 2', async () => {
        const transaction: AvalancheTransactionRequest = {
          tx: createCChainTx() as any
        }

        await ledgerWallet.signAvalancheTransaction({
          accountIndex: 2,
          transaction,
          network: mockNetwork,
          provider: mockProvider
        })

        expect(mockSign).toHaveBeenCalledWith(
          "m/44'/60'/2'",  // Account 2
          ['0/0'],          // Always first address
          expect.any(Buffer),
          undefined
        )
      })

      it('should always use 0/0 signing path for C-chain regardless of account index', async () => {
        const transaction: AvalancheTransactionRequest = {
          tx: createCChainTx() as any
        }

        // Test with account 5
        await ledgerWallet.signAvalancheTransaction({
          accountIndex: 5,
          transaction,
          network: mockNetwork,
          provider: mockProvider
        })

        expect(mockSign).toHaveBeenCalledWith(
          "m/44'/60'/5'",  // Account 5
          ['0/0'],          // Still 0/0, not 0/5
          expect.any(Buffer),
          undefined
        )
      })

      it('should ignore externalIndices for C-chain transactions', async () => {
        const transaction: AvalancheTransactionRequest = {
          tx: createCChainTx() as any,
          externalIndices: [3, 5, 7]  // Should be ignored for C-chain
        }

        await ledgerWallet.signAvalancheTransaction({
          accountIndex: 0,
          transaction,
          network: mockNetwork,
          provider: mockProvider
        })

        expect(mockSign).toHaveBeenCalledWith(
          "m/44'/60'/0'",
          ['0/0'],  // Not ['0/3', '0/5', '0/7']
          expect.any(Buffer),
          undefined
        )
      })
    })

    describe('X/P-chain derivation paths', () => {
      it('should use account index in X-chain account path', async () => {
        const transaction: AvalancheTransactionRequest = {
          tx: createXChainTx() as any,
          externalIndices: [0]
        }

        await ledgerWallet.signAvalancheTransaction({
          accountIndex: 2,
          transaction,
          network: mockNetwork,
          provider: mockProvider
        })

        expect(mockSign).toHaveBeenCalledWith(
          "m/44'/9000'/2'",  // Account 2
          ['0/0'],
          expect.any(Buffer),
          undefined
        )
      })

      it('should use account index in P-chain account path', async () => {
        const transaction: AvalancheTransactionRequest = {
          tx: createPChainTx() as any,
          externalIndices: [0]
        }

        await ledgerWallet.signAvalancheTransaction({
          accountIndex: 3,
          transaction,
          network: mockNetwork,
          provider: mockProvider
        })

        expect(mockSign).toHaveBeenCalledWith(
          "m/44'/9000'/3'",  // Account 3
          ['0/0'],
          expect.any(Buffer),
          undefined
        )
      })

      it('should map external indices to signing paths for X-chain', async () => {
        const transaction: AvalancheTransactionRequest = {
          tx: createXChainTx() as any,
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
          ['0/3', '0/5', '0/7'],  // Multiple UTXO signing paths
          expect.any(Buffer),
          undefined
        )
      })

      it('should default to [0/0] when externalIndices is empty array for X-chain', async () => {
        const transaction: AvalancheTransactionRequest = {
          tx: createXChainTx() as any,
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
          ['0/0'],  // Default fallback
          expect.any(Buffer),
          undefined
        )
      })

      it('should default to [0/0] when externalIndices is undefined for X-chain', async () => {
        const transaction: AvalancheTransactionRequest = {
          tx: createXChainTx() as any
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
          ['0/0'],  // Default fallback
          expect.any(Buffer),
          undefined
        )
      })

      it('should handle single external index for P-chain', async () => {
        const transaction: AvalancheTransactionRequest = {
          tx: createPChainTx() as any,
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
          tx: createXChainTx() as any,
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
          ['1/1', '1/3']  // Change paths
        )
      })

      it('should not include change paths when internalIndices is empty', async () => {
        const transaction: AvalancheTransactionRequest = {
          tx: createXChainTx() as any,
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
          undefined  // No change paths
        )
      })

      it('should not include change paths when internalIndices is undefined', async () => {
        const transaction: AvalancheTransactionRequest = {
          tx: createXChainTx() as any,
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
          undefined  // No change paths
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
          tx: mockTx as any,
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
          tx: mockTx as any,
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
        mockEnsureConnection.mockRejectedValueOnce(new Error('Connection failed'))

        const mockTx = {
          getVM: jest.fn().mockReturnValue('AVM'),
          toBytes: jest.fn().mockReturnValue(new Uint8Array()),
          addSignature: jest.fn(),
          toJSON: jest.fn().mockReturnValue({})
        }

        const transaction: AvalancheTransactionRequest = {
          tx: mockTx as any,
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
          'Please make sure your Ledger device is nearby, unlocked, and Bluetooth is enabled.'
        )
      })

      it('should throw error when Avalanche app is not ready', async () => {
        mockWaitForApp.mockRejectedValueOnce(new Error('App not ready'))

        const mockTx = {
          getVM: jest.fn().mockReturnValue('AVM'),
          toBytes: jest.fn().mockReturnValue(new Uint8Array()),
          addSignature: jest.fn(),
          toJSON: jest.fn().mockReturnValue({})
        }

        const transaction: AvalancheTransactionRequest = {
          tx: mockTx as any,
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
          'Please open the Avalanche app on your Ledger device and try again.'
        )
      })

      it('should throw error when signing fails', async () => {
        mockSign.mockRejectedValue(new Error('User rejected'))

        const mockTx = {
          getVM: jest.fn().mockReturnValue('AVM'),
          toBytes: jest.fn().mockReturnValue(new Uint8Array()),
          addSignature: jest.fn(),
          toJSON: jest.fn().mockReturnValue({})
        }

        const transaction: AvalancheTransactionRequest = {
          tx: mockTx as any,
          externalIndices: [0]
        }

        await expect(
          ledgerWallet.signAvalancheTransaction({
            accountIndex: 0,
            transaction,
            network: mockNetwork,
            provider: mockProvider
          })
        ).rejects.toThrow('Avalanche transaction signing failed: User rejected')
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
          tx: mockTx as any,
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
          tx: mockTx as any,
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
          tx: mockTx as any,
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
})
