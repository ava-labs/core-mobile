/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BlockchainNamespace,
  Network,
  NetworkVMType
} from '@avalabs/core-chains-sdk'
import { CoreAccountType } from '@avalabs/types'
import { Account } from 'store/account/types'
import { buildRequestItemsForAccounts } from './buildRequestItemsForAccounts'

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
  addressC: '0x066b2322a30d7C5838035112F3b816b46D639bBC',
  addressCoreEth: '0x066b2322a30d7C5838035112F3b816b46D639bBC',
  addressBTC: 'bc1qmm9qawklnfau5hhrkt33kqumggxwy7s9raxuxk',
  addressSVM: '9gQmZ7fTTgv5hVScrr9QqT6SpBs7i4cKLDdj4tuae3sW',
  addressAVM: 'X-avax1aahxdv3wqxd42rxdalvp2knxs244r06wrxmvlf',
  addressPVM: 'P-avax1putwtyrvk7vx8zeffmnja8djxku5nnc87au7rj',
  ...overrides
})

const createEvmAddress = (i: number): string =>
  `0x${i.toString(16).padStart(40, '0')}`

describe('buildRequestItemsForAccounts', () => {
  it('splits EVM addresses into max-50 chunks', () => {
    const networks = [createMockNetwork(43114, NetworkVMType.EVM)]
    const accounts = Array.from({ length: 120 }, (_, i) =>
      createMockAccount({
        id: `acc-${i}`,
        addressC: createEvmAddress(i),
        addressCoreEth: createEvmAddress(i),
        addressBTC: undefined,
        addressSVM: undefined
      })
    )

    const xpAddressesByAccountId = new Map(
      accounts.map(acc => [acc.id, [`avax1${acc.id}`, `avax2${acc.id}`]])
    )

    const batches = buildRequestItemsForAccounts(
      networks,
      accounts,
      xpAddressesByAccountId,
      undefined
    )
    const evmItems = batches
      .flatMap(batch => batch)
      .filter(item => item.namespace === BlockchainNamespace.EIP155) as any[]
    const flattenedAddresses = evmItems.flatMap(item => item.addresses)

    expect(evmItems).toHaveLength(3)
    expect(new Set(flattenedAddresses).size).toBe(120)
    evmItems.forEach(item => {
      expect(item.addresses.length).toBeLessThanOrEqual(50)
      expect(item.addresses.length).toBeGreaterThan(0)
      expect(item.references).toEqual(['43114'])
    })
  })

  it('splits BTC addresses into max-50 chunks', () => {
    const networks = [createMockNetwork(1, NetworkVMType.BITCOIN)]
    const accounts = Array.from({ length: 120 }, (_, i) =>
      createMockAccount({
        id: `acc-${i}`,
        addressC: undefined,
        addressCoreEth: undefined,
        addressBTC: `bc1qtest${i.toString().padStart(10, '0')}`,
        addressSVM: undefined
      })
    )

    const xpAddressesByAccountId = new Map(
      accounts.map(acc => [acc.id, [`avax1${acc.id}`]])
    )

    const xpubByAccountId = new Map(accounts.map(acc => [acc.id, undefined]))

    const batches = buildRequestItemsForAccounts({
      networks,
      accounts,
      xpAddressesByAccountId,
      xpubByAccountId
    })
    const btcItems = batches
      .flatMap(batch => batch)
      .filter(item => item.namespace === BlockchainNamespace.BIP122) as any[]
    const flattenedAddresses = btcItems.flatMap(item => item.addresses)

    expect(btcItems).toHaveLength(3)
    expect(new Set(flattenedAddresses).size).toBe(120)
    btcItems.forEach(item => {
      expect(item.addresses.length).toBeLessThanOrEqual(50)
      expect(item.addresses.length).toBeGreaterThan(0)
      expect(item.references.length).toBeGreaterThan(0)
    })
  })

  it('splits SVM addresses into max-50 chunks', () => {
    const networks = [createMockNetwork(1, NetworkVMType.SVM)]
    const accounts = Array.from({ length: 120 }, (_, i) =>
      createMockAccount({
        id: `acc-${i}`,
        addressC: undefined,
        addressCoreEth: undefined,
        addressBTC: undefined,
        addressSVM: `So1anaTest${i.toString().padStart(10, '0')}`
      })
    )

    const xpAddressesByAccountId = new Map(
      accounts.map(acc => [acc.id, [`avax1${acc.id}`]])
    )

    const xpubByAccountId = new Map(accounts.map(acc => [acc.id, undefined]))

    const batches = buildRequestItemsForAccounts({
      networks,
      accounts,
      xpAddressesByAccountId,
      xpubByAccountId
    })
    const svmItems = batches
      .flatMap(batch => batch)
      .filter(item => item.namespace === BlockchainNamespace.SOLANA) as any[]
    const flattenedAddresses = svmItems.flatMap(item => item.addresses)

    expect(svmItems).toHaveLength(3)
    expect(new Set(flattenedAddresses).size).toBe(120)
    svmItems.forEach(item => {
      expect(item.addresses.length).toBeLessThanOrEqual(50)
      expect(item.addresses.length).toBeGreaterThan(0)
      expect(item.references.length).toBeGreaterThan(0)
    })
  })

  it('splits AVAX addressDetails entries into max-50 chunks', () => {
    const networks = [createMockNetwork(1, NetworkVMType.AVM)]
    const accounts = Array.from({ length: 120 }, (_, i) =>
      createMockAccount({
        id: `acc-${i}`,
        addressC: undefined,
        addressCoreEth: undefined,
        addressBTC: undefined,
        addressSVM: undefined
      })
    )

    // Create xpAddresses map with one address per account
    const xpAddressesByAccountId = new Map(
      accounts.map(acc => [acc.id, [`avax1${acc.id}`]])
    )

    const xpubByAccountId = new Map(accounts.map(acc => [acc.id, undefined]))

    const batches = buildRequestItemsForAccounts({
      networks,
      accounts,
      xpAddressesByAccountId,
      xpubByAccountId
    })
    const avaxItems = batches
      .flatMap(batch => batch)
      .filter(item => item.namespace === BlockchainNamespace.AVAX) as any[]

    expect(avaxItems).toHaveLength(3)
    avaxItems.forEach(item => {
      expect(item.addressDetails.length).toBeLessThanOrEqual(50)
      expect(item.addressDetails.length).toBeGreaterThan(0)
      item.addressDetails.forEach((detail: any) => {
        expect(detail.addresses.length).toBeGreaterThan(0)
        expect(detail.addresses.length).toBeLessThanOrEqual(50)
      })
      expect(item.references.length).toBeGreaterThan(0)
    })
  })

  it('splits XP addresses for a single account into max-50 chunks', () => {
    const networks = [createMockNetwork(1, NetworkVMType.AVM)]
    const xpAddresses = Array.from({ length: 120 }, (_, i) => `avax1test${i}`)
    const account = createMockAccount()
    const accounts = [account]

    const xpAddressesByAccountId = new Map([[account.id, xpAddresses]])
    const xpubByAccountId = new Map([[account.id, undefined]])
    const batches = buildRequestItemsForAccounts({
      networks,
      accounts,
      xpAddressesByAccountId,
      xpubByAccountId
    })
    const avaxItems = batches
      .flatMap(batch => batch)
      .filter(item => item.namespace === BlockchainNamespace.AVAX) as any[]

    expect(avaxItems).toHaveLength(1)
    expect(account).toBeDefined()
    const [item] = avaxItems
    expect(item).toBeDefined()
    if (item && account) {
      expect(item.addressDetails).toHaveLength(3)
      item.addressDetails.forEach((detail: any) => {
        expect(detail.id).toBe(account.id)
        expect(detail.addresses.length).toBeGreaterThan(0)
        expect(detail.addresses.length).toBeLessThanOrEqual(50)
      })

      const flattenedAddresses = item.addressDetails.flatMap(
        (detail: any) => detail.addresses
      )
      expect(new Set(flattenedAddresses).size).toBe(120)
    }
  })

  it('does not emit items with empty arrays', () => {
    const networks = [
      createMockNetwork(43114, NetworkVMType.EVM),
      createMockNetwork(1, NetworkVMType.BITCOIN),
      createMockNetwork(1, NetworkVMType.SVM),
      createMockNetwork(1, NetworkVMType.AVM)
    ]
    const account = createMockAccount({
      addressC: '',
      addressCoreEth: '',
      addressBTC: undefined,
      addressSVM: undefined,
      addressAVM: undefined,
      addressPVM: undefined
    })
    const accounts = [account]

    // Even with xpAddresses, if account has no valid addresses, nothing should be emitted
    const xpAddressesByAccountId = new Map([[account.id, []]])
    const xpubByAccountId = new Map([[account.id, undefined]])

    const batches = buildRequestItemsForAccounts({
      networks,
      accounts,
      xpAddressesByAccountId,
      xpubByAccountId
    })
    const allItems = batches.flatMap(batch => batch)

    expect(allItems).toHaveLength(0)
  })

  it('respects EVM reference limit when combined with address chunks', () => {
    const networks = Array.from({ length: 25 }, (_, i) =>
      createMockNetwork(1000 + i, NetworkVMType.EVM)
    )
    const accounts = Array.from({ length: 60 }, (_, i) =>
      createMockAccount({
        id: `acc-${i}`,
        addressC: createEvmAddress(i),
        addressCoreEth: createEvmAddress(i),
        addressBTC: undefined,
        addressSVM: undefined
      })
    )

    const xpAddressesByAccountId = new Map(
      accounts.map(acc => [acc.id, [`avax1${acc.id}`]])
    )
    const xpubByAccountId = new Map(accounts.map(acc => [acc.id, undefined]))

    const batches = buildRequestItemsForAccounts({
      networks,
      accounts,
      xpAddressesByAccountId,
      xpubByAccountId
    })
    const evmItems = batches
      .flatMap(batch => batch)
      .filter(item => item.namespace === BlockchainNamespace.EIP155) as any[]

    // 2 ref chunks (20 + 5) * 2 address chunks (50 + 10) = 4 items
    expect(evmItems).toHaveLength(4)
    evmItems.forEach(item => {
      expect(item.references.length).toBeLessThanOrEqual(20)
      expect(item.references.length).toBeGreaterThan(0)
      expect(item.addresses.length).toBeLessThanOrEqual(50)
      expect(item.addresses.length).toBeGreaterThan(0)
    })
  })

  it('splits request items into batches of max 5', () => {
    const networks = Array.from({ length: 21 }, (_, i) =>
      createMockNetwork(9000 + i, NetworkVMType.EVM)
    )
    const accounts = Array.from({ length: 101 }, (_, i) =>
      createMockAccount({
        id: `acc-${i}`,
        addressC: createEvmAddress(i),
        addressCoreEth: createEvmAddress(i),
        addressBTC: undefined,
        addressSVM: undefined
      })
    )

    const xpAddressesByAccountId = new Map(
      accounts.map(acc => [acc.id, [`avax1${acc.id}`]])
    )
    const xpubByAccountId = new Map(accounts.map(acc => [acc.id, undefined]))

    const batches = buildRequestItemsForAccounts({
      networks,
      accounts,
      xpAddressesByAccountId,
      xpubByAccountId
    })
    const allItems = batches.flatMap(batch => batch)

    expect(allItems).toHaveLength(6)
    expect(batches).toHaveLength(2)
    const [firstBatch, secondBatch] = batches
    expect(firstBatch).toBeDefined()
    expect(secondBatch).toBeDefined()
    if (firstBatch && secondBatch) {
      expect(firstBatch.length).toBe(5)
      expect(secondBatch.length).toBe(1)
    }
  })

  it('uses extendedPublicKeyDetails when xpub is provided', () => {
    const networks = [createMockNetwork(1, NetworkVMType.AVM)]
    const accounts = [
      createMockAccount({ id: 'acc-with-xpub' }),
      createMockAccount({ id: 'acc-without-xpub' })
    ]

    const xpAddressesByAccountId = new Map([
      ['acc-with-xpub', ['avax1addr1', 'avax1addr2']],
      ['acc-without-xpub', ['avax1addr3', 'avax1addr4']]
    ])

    const xpubByAccountId = new Map([
      [
        'acc-with-xpub',
        'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8'
      ]
    ])

    const batches = buildRequestItemsForAccounts({
      networks,
      accounts,
      xpAddressesByAccountId,
      xpubByAccountId
    })

    const avaxItems = batches
      .flatMap(batch => batch)
      .filter(item => item.namespace === BlockchainNamespace.AVAX) as any[]

    expect(avaxItems).toHaveLength(1)
    const [item] = avaxItems

    // Should have extendedPublicKeyDetails for account with xpub
    expect(item.extendedPublicKeyDetails).toBeDefined()
    expect(item.extendedPublicKeyDetails).toHaveLength(1)
    expect(item.extendedPublicKeyDetails[0].id).toBe('acc-with-xpub')
    expect(item.extendedPublicKeyDetails[0].extendedPublicKey).toBe(
      'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8'
    )

    // Should have addressDetails for account without xpub
    expect(item.addressDetails).toBeDefined()
    expect(item.addressDetails).toHaveLength(1)
    expect(item.addressDetails[0].id).toBe('acc-without-xpub')
    expect(item.addressDetails[0].addresses).toEqual([
      'avax1addr3',
      'avax1addr4'
    ])
  })

  it('uses only extendedPublicKeyDetails when all accounts have xpub', () => {
    const networks = [createMockNetwork(1, NetworkVMType.PVM)]
    const accounts = [
      createMockAccount({ id: 'acc-1' }),
      createMockAccount({ id: 'acc-2' })
    ]

    const xpAddressesByAccountId = new Map([
      ['acc-1', ['avax1addr1']],
      ['acc-2', ['avax1addr2']]
    ])

    const xpubByAccountId = new Map([
      ['acc-1', 'xpub1'],
      ['acc-2', 'xpub2']
    ])

    const batches = buildRequestItemsForAccounts({
      networks,
      accounts,
      xpAddressesByAccountId,
      xpubByAccountId
    })
    const avaxItems = batches
      .flatMap(batch => batch)
      .filter(item => item.namespace === BlockchainNamespace.AVAX) as any[]

    expect(avaxItems).toHaveLength(1)
    const [item] = avaxItems

    // Should only have extendedPublicKeyDetails
    expect(item.extendedPublicKeyDetails).toBeDefined()
    expect(item.extendedPublicKeyDetails).toHaveLength(2)
    expect(item.addressDetails).toBeUndefined()
  })
})
