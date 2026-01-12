/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BlockchainNamespace,
  Network,
  NetworkVMType
} from '@avalabs/core-chains-sdk'
import { CoreAccountType } from '@avalabs/types'
import { Account } from 'store/account/types'
import { buildRequestItemsForAccount } from './buildRequestItemsForAccount'

const createMockNetwork = (
  chainId: number,
  vmName: NetworkVMType,
  isTestnet = false
): Network => ({
  chainId,
  chainName: `Network ${chainId}`,
  description: '',
  explorerUrl: '',
  isTestnet,
  logoUri: '',
  mainnetChainId: 0,
  networkToken: {
    symbol: 'TEST',
    name: 'Test Token',
    description: '',
    decimals: 18,
    logoUri: ''
  },
  platformChainId: '',
  rpcUrl: '',
  subnetId: '',
  vmId: '',
  vmName
})

const createMockAccount = (overrides?: Partial<Account>): Account => ({
  id: 'test-account-id',
  name: 'Test Account',
  walletId: 'test-wallet-id',
  index: 0,
  type: CoreAccountType.PRIMARY as CoreAccountType.PRIMARY,
  hasMigratedXpAddresses: true,
  addressC: '0x066b2322a30d7C5838035112F3b816b46D639bBC',
  addressCoreEth: '0x066b2322a30d7C5838035112F3b816b46D639bBC',
  addressBTC: 'bc1qmm9qawklnfau5hhrkt33kqumggxwy7s9raxuxk',
  addressSVM: '9gQmZ7fTTgv5hVScrr9QqT6SpBs7i4cKLDdj4tuae3sW',
  addressAVM: 'X-avax1aahxdv3wqxd42rxdalvp2knxs244r06wrxmvlf',
  addressPVM: 'P-avax1putwtyrvk7vx8zeffmnja8djxku5nnc87au7rj',
  xpAddresses: [
    {
      address: 'X-avax1aahxdv3wqxd42rxdalvp2knxs244r06wrxmvlf',
      index: 0
    },
    {
      address: 'P-avax1putwtyrvk7vx8zeffmnja8djxku5nnc87au7rj',
      index: 0
    }
  ],
  xpAddressDictionary: {
    'X-avax1aahxdv3wqxd42rxdalvp2knxs244r06wrxmvlf': {
      space: 'e' as const,
      index: 0,
      hasActivity: true
    },
    'P-avax1putwtyrvk7vx8zeffmnja8djxku5nnc87au7rj': {
      space: 'e' as const,
      index: 0,
      hasActivity: true
    }
  },
  ...overrides
})

describe('buildRequestItemsForAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('basic functionality', () => {
    it('should create a single batch for a single EVM network', () => {
      const account = createMockAccount()
      const networks = [createMockNetwork(43114, NetworkVMType.EVM)]

      const batches = buildRequestItemsForAccount(networks, account)

      expect(batches).toHaveLength(1)
      expect(batches[0]).toHaveLength(1)
      expect(batches[0]![0]).toMatchObject({
        namespace: BlockchainNamespace.EIP155,
        addresses: ['0x066b2322a30d7C5838035112F3b816b46D639bBC'],
        references: ['43114']
      })
    })

    it('should combine multiple EVM networks into one request item when under limit', () => {
      const account = createMockAccount()
      const networks = [
        createMockNetwork(43114, NetworkVMType.EVM), // C-Chain
        createMockNetwork(1, NetworkVMType.EVM), // Ethereum
        createMockNetwork(42161, NetworkVMType.EVM), // Arbitrum
        createMockNetwork(10, NetworkVMType.EVM) // Optimism
      ]

      const batches = buildRequestItemsForAccount(networks, account)

      expect(batches).toHaveLength(1)
      expect(batches[0]).toHaveLength(1)
      const evmItem = batches[0]![0] as any
      expect(evmItem.namespace).toBe(BlockchainNamespace.EIP155)
      expect(evmItem.addresses).toEqual([
        '0x066b2322a30d7C5838035112F3b816b46D639bBC'
      ])
      expect(evmItem.references).toHaveLength(4)
      expect(evmItem.references).toContain('43114')
      expect(evmItem.references).toContain('1')
      expect(evmItem.references).toContain('42161')
      expect(evmItem.references).toContain('10')
    })

    it('should handle multiple namespaces in a single batch', () => {
      const account = createMockAccount()
      const networks = [
        createMockNetwork(43114, NetworkVMType.EVM),
        createMockNetwork(1, NetworkVMType.BITCOIN),
        createMockNetwork(1, NetworkVMType.SVM),
        createMockNetwork(1, NetworkVMType.AVM),
        createMockNetwork(1, NetworkVMType.PVM)
      ]

      const batches = buildRequestItemsForAccount(networks, account)

      expect(batches).toHaveLength(1)
      const batch = batches[0]!
      expect(batch.length).toBeGreaterThanOrEqual(4) // EVM, BTC, Solana, AVAX

      const namespaces = batch.map(item => item.namespace)
      expect(namespaces).toContain(BlockchainNamespace.EIP155)
      expect(namespaces).toContain(BlockchainNamespace.BIP122)
      expect(namespaces).toContain(BlockchainNamespace.SOLANA)
      expect(namespaces).toContain(BlockchainNamespace.AVAX)
    })
  })

  describe('EVM reference limit splitting', () => {
    it('should split EVM references when exceeding 20', () => {
      const account = createMockAccount()
      // Create 25 EVM networks
      const networks = Array.from({ length: 25 }, (_, i) =>
        createMockNetwork(1000 + i, NetworkVMType.EVM)
      )

      const batches = buildRequestItemsForAccount(networks, account)

      // Should create 2 batches (20 + 5)
      expect(batches.length).toBeGreaterThanOrEqual(1)

      // Count total EVM items across all batches
      const allEvmItems = batches.flatMap(batch =>
        batch.filter(item => item.namespace === BlockchainNamespace.EIP155)
      )

      expect(allEvmItems.length).toBeGreaterThanOrEqual(2)

      // Check that each EVM item has at most 20 references
      allEvmItems.forEach(item => {
        const evmItem = item as any
        expect(evmItem.references.length).toBeLessThanOrEqual(20)
      })

      // Verify total references match
      const totalReferences = allEvmItems.reduce(
        (sum, item) => sum + (item as any).references.length,
        0
      )
      expect(totalReferences).toBe(25)
    })

    it('should split exactly at 20 references', () => {
      const account = createMockAccount()
      // Create exactly 20 EVM networks
      const networks20 = Array.from({ length: 20 }, (_, i) =>
        createMockNetwork(1000 + i, NetworkVMType.EVM)
      )

      const batches20 = buildRequestItemsForAccount(networks20, account)
      const evmItems20 = batches20.flatMap(batch =>
        batch.filter(item => item.namespace === BlockchainNamespace.EIP155)
      )
      expect(evmItems20).toHaveLength(1)
      expect((evmItems20[0] as any).references).toHaveLength(20)

      // Create 21 EVM networks
      const networks21 = Array.from({ length: 21 }, (_, i) =>
        createMockNetwork(1000 + i, NetworkVMType.EVM)
      )

      const batches21 = buildRequestItemsForAccount(networks21, account)
      const evmItems21 = batches21.flatMap(batch =>
        batch.filter(item => item.namespace === BlockchainNamespace.EIP155)
      )
      expect(evmItems21.length).toBeGreaterThanOrEqual(2)
      expect((evmItems21[0] as any).references).toHaveLength(20)
      expect((evmItems21[1] as any).references).toHaveLength(1)
    })

    it('should include all addresses in each EVM batch when split', () => {
      const account = createMockAccount({
        addressC: '0xAddress1',
        addressCoreEth: '0xAddress2'
      })
      // Create 25 EVM networks to force splitting
      const networks = Array.from({ length: 25 }, (_, i) =>
        createMockNetwork(1000 + i, NetworkVMType.EVM)
      )

      const batches = buildRequestItemsForAccount(networks, account)
      const evmItems = batches.flatMap(batch =>
        batch.filter(item => item.namespace === BlockchainNamespace.EIP155)
      )

      // All EVM items should have the same addresses
      const firstAddresses = (evmItems[0] as any).addresses
      evmItems.forEach(item => {
        expect((item as any).addresses).toEqual(firstAddresses)
      })
    })
  })

  describe('namespace distribution across batches', () => {
    it('should combine multiple EVM batches with other namespaces when within limit', () => {
      const account = createMockAccount()
      // Create 25 EVM networks (splits into 2 EVM batches) + 3 other namespaces
      // Total: 2 EVM + 3 others = 5 items, should fit in one batch
      const networks = [
        ...Array.from({ length: 25 }, (_, i) =>
          createMockNetwork(1000 + i, NetworkVMType.EVM)
        ),
        createMockNetwork(1, NetworkVMType.BITCOIN),
        createMockNetwork(1, NetworkVMType.SVM),
        createMockNetwork(1, NetworkVMType.AVM),
        createMockNetwork(1, NetworkVMType.PVM)
      ]

      const batches = buildRequestItemsForAccount(networks, account)

      // Should combine into 1 batch: 2 EVM batches + 3 other namespaces = 5 items
      expect(batches).toHaveLength(1)
      const firstBatch = batches[0]!
      expect(firstBatch.length).toBe(5)

      // Count EVM items (should be 2)
      const evmItems = firstBatch.filter(
        item => item.namespace === BlockchainNamespace.EIP155
      )
      expect(evmItems.length).toBe(2)

      // Verify all namespaces are present
      const namespaces = firstBatch.map(item => item.namespace)
      expect(namespaces).toContain(BlockchainNamespace.EIP155)
      expect(namespaces).toContain(BlockchainNamespace.BIP122)
      expect(namespaces).toContain(BlockchainNamespace.SOLANA)
      expect(namespaces).toContain(BlockchainNamespace.AVAX)
    })

    it('should split when EVM batches plus other namespaces exceed limit', () => {
      const account = createMockAccount()
      // Create scenario where we have more than 5 items total
      // We need more than 25 EVM networks to create 3+ EVM batches
      // 3 EVM batches + 3 other namespaces = 6 items (exceeds limit)
      const networks = [
        ...Array.from({ length: 45 }, (_, i) =>
          createMockNetwork(1000 + i, NetworkVMType.EVM)
        ),
        createMockNetwork(1, NetworkVMType.BITCOIN),
        createMockNetwork(1, NetworkVMType.SVM),
        createMockNetwork(1, NetworkVMType.AVM),
        createMockNetwork(1, NetworkVMType.PVM)
      ]

      const batches = buildRequestItemsForAccount(networks, account)

      // Should split into multiple batches
      expect(batches.length).toBeGreaterThanOrEqual(1)

      // First batch should have max 5 items
      const firstBatch = batches[0]!
      expect(firstBatch.length).toBeLessThanOrEqual(5)

      // All batches should respect the limit
      batches.forEach(batch => {
        expect(batch.length).toBeLessThanOrEqual(5)
      })

      // Verify all namespaces are still present across batches
      const allNamespaces = batches.flatMap(batch =>
        batch.map(item => item.namespace)
      )
      expect(allNamespaces).toContain(BlockchainNamespace.EIP155)
      expect(allNamespaces).toContain(BlockchainNamespace.BIP122)
      expect(allNamespaces).toContain(BlockchainNamespace.SOLANA)
      expect(allNamespaces).toContain(BlockchainNamespace.AVAX)
    })

    it('should include all namespaces in single batch when EVM is not split', () => {
      const account = createMockAccount()
      const networks = [
        createMockNetwork(43114, NetworkVMType.EVM),
        createMockNetwork(1, NetworkVMType.EVM),
        createMockNetwork(1, NetworkVMType.BITCOIN),
        createMockNetwork(1, NetworkVMType.SVM),
        createMockNetwork(1, NetworkVMType.AVM),
        createMockNetwork(1, NetworkVMType.PVM)
      ]

      const batches = buildRequestItemsForAccount(networks, account)

      expect(batches).toHaveLength(1)
      const batch = batches[0]!
      const namespaces = batch.map(item => item.namespace)
      expect(namespaces).toContain(BlockchainNamespace.EIP155)
      expect(namespaces).toContain(BlockchainNamespace.BIP122)
      expect(namespaces).toContain(BlockchainNamespace.SOLANA)
      expect(namespaces).toContain(BlockchainNamespace.AVAX)
    })
  })

  describe('namespace limit splitting', () => {
    it('should combine EVM batches when total items are within limit', () => {
      const account = createMockAccount()
      // Create 25 EVM networks (splits into 2 EVM batches) + 3 other namespaces
      // Total: 2 EVM + 3 others = 5 items, should combine into 1 batch
      const networks = [
        ...Array.from({ length: 25 }, (_, i) =>
          createMockNetwork(1000 + i, NetworkVMType.EVM)
        ),
        createMockNetwork(1, NetworkVMType.BITCOIN),
        createMockNetwork(1, NetworkVMType.SVM),
        createMockNetwork(1, NetworkVMType.AVM),
        createMockNetwork(1, NetworkVMType.PVM)
      ]

      const batches = buildRequestItemsForAccount(networks, account)

      // Should combine into 1 batch with 5 items
      expect(batches).toHaveLength(1)
      expect(batches[0]!.length).toBe(5)

      // Verify all items are present
      const batch = batches[0]!
      const evmItems = batch.filter(
        item => item.namespace === BlockchainNamespace.EIP155
      )
      expect(evmItems.length).toBe(2) // 2 EVM batches

      const namespaces = batch.map(item => item.namespace)
      expect(
        namespaces.filter(n => n === BlockchainNamespace.EIP155).length
      ).toBe(2)
      expect(namespaces).toContain(BlockchainNamespace.BIP122)
      expect(namespaces).toContain(BlockchainNamespace.SOLANA)
      expect(namespaces).toContain(BlockchainNamespace.AVAX)
    })

    it('should order items with non-EVM namespaces first, then EVM batches', () => {
      const account = createMockAccount()
      // Create 25 EVM networks (splits into 2 EVM batches) + 3 other namespaces
      const networks = [
        ...Array.from({ length: 25 }, (_, i) =>
          createMockNetwork(1000 + i, NetworkVMType.EVM)
        ),
        createMockNetwork(1, NetworkVMType.BITCOIN),
        createMockNetwork(1, NetworkVMType.SVM),
        createMockNetwork(1, NetworkVMType.AVM),
        createMockNetwork(1, NetworkVMType.PVM)
      ]

      const batches = buildRequestItemsForAccount(networks, account)
      const batch = batches[0]!

      // Verify order: non-EVM namespaces should come first, then EVM batches
      const namespaces = batch.map(item => item.namespace)

      // First 3 items should be non-EVM (BTC, Solana, AVAX - order may vary)
      const firstThree = namespaces.slice(0, 3)
      expect(firstThree).not.toContain(BlockchainNamespace.EIP155)
      expect(firstThree).toContain(BlockchainNamespace.BIP122)
      expect(firstThree).toContain(BlockchainNamespace.SOLANA)
      expect(firstThree).toContain(BlockchainNamespace.AVAX)

      // Last 2 items should be EVM batches
      const lastTwo = namespaces.slice(3)
      expect(lastTwo.every(n => n === BlockchainNamespace.EIP155)).toBe(true)
      expect(lastTwo.length).toBe(2)
    })

    it('should split when total items exceed 5', () => {
      const account = createMockAccount()
      // Create 45 EVM networks (splits into 3 EVM batches: 20 + 20 + 5) + 3 other namespaces
      // Total: 3 EVM + 3 others = 6 items (exceeds limit), should split
      const networks = [
        ...Array.from({ length: 45 }, (_, i) =>
          createMockNetwork(1000 + i, NetworkVMType.EVM)
        ),
        createMockNetwork(1, NetworkVMType.BITCOIN),
        createMockNetwork(1, NetworkVMType.SVM),
        createMockNetwork(1, NetworkVMType.AVM),
        createMockNetwork(1, NetworkVMType.PVM)
      ]

      const batches = buildRequestItemsForAccount(networks, account)

      // Should split into multiple batches
      expect(batches.length).toBeGreaterThanOrEqual(2)

      // All batches should respect the 5 item limit
      batches.forEach(batch => {
        expect(batch.length).toBeLessThanOrEqual(5)
      })

      // Verify all namespaces are still present across batches
      const allNamespaces = batches.flatMap(batch =>
        batch.map(item => item.namespace)
      )
      expect(allNamespaces).toContain(BlockchainNamespace.EIP155)
      expect(allNamespaces).toContain(BlockchainNamespace.BIP122)
      expect(allNamespaces).toContain(BlockchainNamespace.SOLANA)
      expect(allNamespaces).toContain(BlockchainNamespace.AVAX)
    })

    it('should handle a batch with exactly 5 namespaces (at limit)', () => {
      const account = createMockAccount()
      // Create exactly 4 namespaces: EVM, BTC, Solana, AVAX
      // (We can't easily create 5 unique namespaces with current VM types)
      // But we can verify that 4 namespaces works fine
      const networks = [
        createMockNetwork(43114, NetworkVMType.EVM),
        createMockNetwork(1, NetworkVMType.EVM),
        createMockNetwork(1, NetworkVMType.BITCOIN),
        createMockNetwork(1, NetworkVMType.SVM),
        createMockNetwork(1, NetworkVMType.AVM),
        createMockNetwork(1, NetworkVMType.PVM)
      ]

      const batches = buildRequestItemsForAccount(networks, account)

      // Should have 1 batch with 4 namespaces (within limit of 5)
      expect(batches).toHaveLength(1)
      expect(batches[0]!.length).toBeLessThanOrEqual(5)
    })

    it('should optimally pack items across batches', () => {
      const account = createMockAccount()
      // Create 45 EVM networks (3 EVM batches) + 3 other namespaces = 6 items total
      // Should split into: Batch 1 (5 items) + Batch 2 (1 item)
      const networks = [
        ...Array.from({ length: 45 }, (_, i) =>
          createMockNetwork(1000 + i, NetworkVMType.EVM)
        ),
        createMockNetwork(1, NetworkVMType.BITCOIN),
        createMockNetwork(1, NetworkVMType.SVM),
        createMockNetwork(1, NetworkVMType.AVM),
        createMockNetwork(1, NetworkVMType.PVM)
      ]

      const batches = buildRequestItemsForAccount(networks, account)

      // Should split into multiple batches
      expect(batches.length).toBeGreaterThanOrEqual(2)

      // First batch should be optimally packed (5 items)
      const firstBatch = batches[0]!
      expect(firstBatch.length).toBe(5)

      // All batches should respect the limit
      batches.forEach(batch => {
        expect(batch.length).toBeLessThanOrEqual(5)
      })
    })

    it('should preserve all request items when splitting by namespace limit', () => {
      const account = createMockAccount()
      const networks = [
        ...Array.from({ length: 25 }, (_, i) =>
          createMockNetwork(1000 + i, NetworkVMType.EVM)
        ),
        createMockNetwork(1, NetworkVMType.BITCOIN),
        createMockNetwork(1, NetworkVMType.SVM),
        createMockNetwork(1, NetworkVMType.AVM),
        createMockNetwork(1, NetworkVMType.PVM)
      ]

      const batches = buildRequestItemsForAccount(networks, account)

      // Count total items across all batches
      const totalItems = batches.reduce((sum, batch) => sum + batch.length, 0)

      // Should have: 2 EVM batches + 1 BTC + 1 Solana + 1 AVAX = 5 total items
      // With new logic, these should all be in 1 batch
      expect(totalItems).toBe(5)
      expect(batches).toHaveLength(1)

      // Verify all expected namespaces are present
      const allNamespaces = batches.flatMap(batch =>
        batch.map(item => item.namespace)
      )
      const uniqueNamespaces = new Set(allNamespaces)

      // Should have EVM, BTC, Solana, AVAX
      expect(uniqueNamespaces.has(BlockchainNamespace.EIP155)).toBe(true)
      expect(uniqueNamespaces.has(BlockchainNamespace.BIP122)).toBe(true)
      expect(uniqueNamespaces.has(BlockchainNamespace.SOLANA)).toBe(true)
      expect(uniqueNamespaces.has(BlockchainNamespace.AVAX)).toBe(true)

      // Should have 2 EVM items (2 batches)
      const evmItems = allNamespaces.filter(
        n => n === BlockchainNamespace.EIP155
      )
      expect(evmItems.length).toBe(2)
    })
  })

  describe('AVAX namespace handling', () => {
    it('should create AVAX namespace item with addressDetails', () => {
      const account = createMockAccount()
      const networks = [
        createMockNetwork(1, NetworkVMType.AVM),
        createMockNetwork(1, NetworkVMType.PVM)
      ]

      const batches = buildRequestItemsForAccount(networks, account)

      const avaxItem = batches[0]!.find(
        item => item.namespace === BlockchainNamespace.AVAX
      ) as any

      expect(avaxItem).toBeDefined()
      expect(avaxItem.references).toHaveLength(2)
      expect(avaxItem.references).toContain('imji8papUf2EhV3le337w1vgFauqkJg-')
      expect(avaxItem.references).toContain('Rr9hnPVPxuUvrdCul-vjEsU1zmqKqRDo')
      expect(avaxItem.addressDetails).toHaveLength(1)
      expect(avaxItem.addressDetails[0]!.id).toBe('test-account-id')
      expect(avaxItem.addressDetails[0]!.addresses.length).toBeGreaterThan(0)
    })

    it('should handle account with xpAddresses', () => {
      const account = createMockAccount({
        xpAddresses: [
          { address: 'X-avax1test1', index: 0 },
          { address: 'P-avax1test2', index: 0 }
        ]
      })
      const networks = [createMockNetwork(1, NetworkVMType.AVM)]

      const batches = buildRequestItemsForAccount(networks, account)

      const avaxItem = batches[0]!.find(
        item => item.namespace === BlockchainNamespace.AVAX
      ) as any

      expect(avaxItem).toBeDefined()
      expect(avaxItem.addressDetails[0]!.addresses).toContain('avax1test1')
    })

    it('should handle account with fallback addresses', () => {
      const account = createMockAccount({
        xpAddresses: [],
        addressAVM: 'X-avax1fallback',
        addressPVM: 'P-avax1fallback2'
      })
      const networks = [createMockNetwork(1, NetworkVMType.AVM)]

      const batches = buildRequestItemsForAccount(networks, account)

      const avaxItem = batches[0]!.find(
        item => item.namespace === BlockchainNamespace.AVAX
      ) as any

      expect(avaxItem).toBeDefined()
      expect(avaxItem.addressDetails[0]!.addresses.length).toBeGreaterThan(0)
    })
  })

  describe('edge cases', () => {
    it('should handle empty networks array', () => {
      const account = createMockAccount()
      const batches = buildRequestItemsForAccount([], account)

      expect(batches).toHaveLength(1)
      expect(batches[0]).toEqual([])
    })

    it('should skip networks with missing addresses', () => {
      const account = createMockAccount({
        addressC: '',
        addressBTC: undefined as any
      })
      const networks = [
        createMockNetwork(43114, NetworkVMType.EVM),
        createMockNetwork(1, NetworkVMType.BITCOIN)
      ]

      const batches = buildRequestItemsForAccount(networks, account)

      // Should not include EVM or BTC since addresses are missing
      const batch = batches[0]!
      const namespaces = batch.map(item => item.namespace)
      expect(namespaces).not.toContain(BlockchainNamespace.EIP155)
      expect(namespaces).not.toContain(BlockchainNamespace.BIP122)
    })

    it('should handle testnet networks correctly', () => {
      const account = createMockAccount()
      const networks = [
        createMockNetwork(43113, NetworkVMType.EVM, true), // Fuji testnet
        createMockNetwork(1, NetworkVMType.BITCOIN, true),
        createMockNetwork(1, NetworkVMType.SVM, true),
        createMockNetwork(1, NetworkVMType.AVM, true),
        createMockNetwork(1, NetworkVMType.PVM, true)
      ]

      const batches = buildRequestItemsForAccount(networks, account)

      const batch = batches[0]!
      const btcItem = batch.find(
        item => item.namespace === BlockchainNamespace.BIP122
      ) as any
      expect(btcItem.references).toContain('000000000933ea01ad0ee984209779ba')

      const svmItem = batch.find(
        item => item.namespace === BlockchainNamespace.SOLANA
      ) as any
      expect(svmItem.references).toContain('EtWTRABZaYq6iMfeYKouRu166VU2xqa1')

      const avaxItem = batch.find(
        item => item.namespace === BlockchainNamespace.AVAX
      ) as any
      expect(avaxItem.references).toContain('8AJTpRj3SAqv1e80Mtl9em08LhvKEbkl')
      expect(avaxItem.references).toContain('Sj7NVE3jXTbJvwFAiu7OEUo_8g8ctXMG')
    })

    it('should deduplicate addresses and references', () => {
      const account = createMockAccount()
      const networks = [
        createMockNetwork(43114, NetworkVMType.EVM),
        createMockNetwork(43114, NetworkVMType.EVM), // Duplicate
        createMockNetwork(1, NetworkVMType.EVM)
      ]

      const batches = buildRequestItemsForAccount(networks, account)

      const evmItem = batches[0]!.find(
        item => item.namespace === BlockchainNamespace.EIP155
      ) as any

      expect(evmItem.references).toHaveLength(2) // Should deduplicate
      expect(evmItem.references).toContain('43114')
      expect(evmItem.references).toContain('1')
    })
  })

  describe('real-world scenario', () => {
    it('should handle the example payload scenario', () => {
      const account = createMockAccount({
        addressC: '0x066b2322a30d7C5838035112F3b816b46D639bBC',
        addressBTC: 'bc1qmm9qawklnfau5hhrkt33kqumggxwy7s9raxuxk',
        addressSVM: '9gQmZ7fTTgv5hVScrr9QqT6SpBs7i4cKLDdj4tuae3sW',
        addressAVM: 'X-avax1aahxdv3wqxd42rxdalvp2knxs244r06wrxmvlf',
        addressPVM: 'P-avax1putwtyrvk7vx8zeffmnja8djxku5nnc87au7rj',
        xpAddresses: [
          {
            address: 'X-avax1aahxdv3wqxd42rxdalvp2knxs244r06wrxmvlf',
            index: 0
          },
          {
            address: 'P-avax1putwtyrvk7vx8zeffmnja8djxku5nnc87au7rj',
            index: 0
          }
        ]
      })

      // Create networks matching the example payload
      const evmChainIds = [
        43114, 1, 42161, 10, 8453, 357, 389, 1080, 1216, 1228, 1234, 1344, 1510,
        1888, 2044, 3011, 4313, 4337, 5040, 5041, 5566, 6119, 6533, 7272, 7888,
        7979, 8021
      ]

      const networks = [
        ...evmChainIds.map(chainId =>
          createMockNetwork(chainId, NetworkVMType.EVM)
        ),
        createMockNetwork(1, NetworkVMType.BITCOIN),
        createMockNetwork(1, NetworkVMType.SVM),
        createMockNetwork(1, NetworkVMType.AVM),
        createMockNetwork(1, NetworkVMType.PVM)
      ]

      const batches = buildRequestItemsForAccount(networks, account)

      // With 27 EVM references (split into 2 EVM batches) + 3 other namespaces = 5 items total
      // Should combine into 1 batch (within the 5 namespace limit)
      expect(batches).toHaveLength(1)

      const firstBatch = batches[0]!
      expect(firstBatch.length).toBe(5)

      // Should have 2 EVM items (2 batches due to reference limit)
      const evmItems = firstBatch.filter(
        item => item.namespace === BlockchainNamespace.EIP155
      )
      expect(evmItems.length).toBe(2)

      // Verify EVM references are split correctly
      const evmItem1 = evmItems[0] as any
      const evmItem2 = evmItems[1] as any
      expect(evmItem1.references.length).toBe(20)
      expect(evmItem2.references.length).toBe(7)

      // Verify all other namespaces are present
      expect(
        firstBatch.some(item => item.namespace === BlockchainNamespace.BIP122)
      ).toBe(true)
      expect(
        firstBatch.some(item => item.namespace === BlockchainNamespace.SOLANA)
      ).toBe(true)
      expect(
        firstBatch.some(item => item.namespace === BlockchainNamespace.AVAX)
      ).toBe(true)

      // Total EVM references should be 27
      const totalReferences =
        evmItem1.references.length + evmItem2.references.length
      expect(totalReferences).toBe(27)
    })
  })
})
