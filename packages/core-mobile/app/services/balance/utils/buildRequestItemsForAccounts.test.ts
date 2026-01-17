/* eslint-disable @typescript-eslint/no-non-null-assertion */
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
        addressSVM: undefined,
        xpAddresses: []
      })
    )

    const batches = buildRequestItemsForAccounts(networks, accounts)
    const evmItems = batches
      .flatMap(batch => batch)
      .filter(item => item.namespace === BlockchainNamespace.EIP155) as any[]

    expect(evmItems).toHaveLength(3)
    evmItems.forEach(item => {
      expect(item.addresses.length).toBeLessThanOrEqual(50)
      expect(item.addresses.length).toBeGreaterThan(0)
      expect(item.references).toEqual(['43114'])
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
        addressSVM: undefined,
        xpAddresses: [
          {
            address: `X-avax1test${i}`,
            index: 0
          }
        ]
      })
    )

    const batches = buildRequestItemsForAccounts(networks, accounts)
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

  it('does not emit items with empty arrays', () => {
    const networks = [
      createMockNetwork(43114, NetworkVMType.EVM),
      createMockNetwork(1, NetworkVMType.BITCOIN),
      createMockNetwork(1, NetworkVMType.SVM),
      createMockNetwork(1, NetworkVMType.AVM)
    ]
    const accounts = [
      createMockAccount({
        addressC: '',
        addressCoreEth: '',
        addressBTC: undefined,
        addressSVM: undefined,
        addressAVM: undefined,
        addressPVM: undefined,
        xpAddresses: []
      })
    ]

    const batches = buildRequestItemsForAccounts(networks, accounts)
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
        addressSVM: undefined,
        xpAddresses: []
      })
    )

    const batches = buildRequestItemsForAccounts(networks, accounts)
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
})
