import { CoreAccountType } from '@avalabs/types'
import { Account } from 'store/account/types'
import { WalletType } from 'services/wallet/types'

const mockFetchQuery = jest.fn()
const mockGetAddressesFromXpubXP = jest.fn()

jest.mock('contexts/ReactQueryProvider', () => ({
  queryClient: {
    fetchQuery: (...args: unknown[]) => mockFetchQuery(...args)
  }
}))

jest.mock('utils/getAddressesFromXpubXP/getAddressesFromXpubXP', () => ({
  getAddressesFromXpubXP: (...args: unknown[]) =>
    mockGetAddressesFromXpubXP(...args)
}))

jest.mock('utils/Logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    trace: jest.fn()
  }
}))

const { getCachedXPAddresses } = require('./useXPAddresses')

const PVM_ADDRESS = 'P-avax1putwtyrvk7vx8zeffmnja8djxku5nnc87au7rj'
const STRIPPED_PVM_ADDRESS = 'avax1putwtyrvk7vx8zeffmnja8djxku5nnc87au7rj'

const createMockAccount = (overrides?: Partial<Account>): Account =>
  ({
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
    addressPVM: PVM_ADDRESS,
    ...overrides
  } as Account)

describe('getCachedXPAddresses', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns the resolved addresses when the lookup succeeds', async () => {
    mockFetchQuery.mockImplementation(({ queryFn }) => queryFn())
    mockGetAddressesFromXpubXP.mockResolvedValue({
      xpAddresses: [{ address: `X-${STRIPPED_PVM_ADDRESS}`, index: 0 }],
      xpAddressDictionary: {
        [STRIPPED_PVM_ADDRESS]: { space: 'e', index: 0, hasActivity: true }
      }
    })

    const result = await getCachedXPAddresses({
      walletId: 'test-wallet-id',
      walletType: WalletType.LEDGER,
      account: createMockAccount(),
      isDeveloperMode: false
    })

    expect(result.xpAddresses).toEqual([STRIPPED_PVM_ADDRESS])
    expect(result.xpAddressDictionary).toEqual({
      [STRIPPED_PVM_ADDRESS]: { space: 'e', index: 0, hasActivity: true }
    })
  })

  // CP-14507: a successful lookup can still return empty results (e.g. a Ledger
  // account with no X/P activity yet). It must fall back to the account's
  // primary P-chain address rather than returning an empty dictionary.
  it('falls back to the account primary P-chain address when the lookup returns empty', async () => {
    mockFetchQuery.mockImplementation(({ queryFn }) => queryFn())
    mockGetAddressesFromXpubXP.mockResolvedValue({
      xpAddresses: [],
      xpAddressDictionary: {}
    })

    const result = await getCachedXPAddresses({
      walletId: 'test-wallet-id',
      walletType: WalletType.LEDGER,
      account: createMockAccount(),
      isDeveloperMode: false
    })

    expect(result.xpAddresses).toEqual([STRIPPED_PVM_ADDRESS])
    expect(result.xpAddressDictionary).toEqual({
      [STRIPPED_PVM_ADDRESS]: { space: 'e', index: 0, hasActivity: false }
    })
  })

  // CP-14507: a Ledger wallet whose Avalanche xpub can't be derived makes the
  // lookup throw. Instead of returning an empty dictionary (which breaks XP
  // signing and blocks C->P CCT swaps), it must fall back to the account's
  // primary P-chain address — mirroring the useXPAddresses hook.
  it('falls back to the account primary P-chain address when the lookup throws', async () => {
    mockFetchQuery.mockRejectedValue(new Error('No xpub stored for account'))

    const result = await getCachedXPAddresses({
      walletId: 'test-wallet-id',
      walletType: WalletType.LEDGER,
      account: createMockAccount(),
      isDeveloperMode: false
    })

    expect(result.xpAddresses).toEqual([STRIPPED_PVM_ADDRESS])
    expect(result.xpAddressDictionary).toEqual({
      [STRIPPED_PVM_ADDRESS]: { space: 'e', index: 0, hasActivity: false }
    })
  })

  it('returns empty when the lookup throws and the account has no P-chain address', async () => {
    mockFetchQuery.mockRejectedValue(new Error('No xpub stored for account'))

    const result = await getCachedXPAddresses({
      walletId: 'test-wallet-id',
      walletType: WalletType.LEDGER,
      account: createMockAccount({ addressPVM: '' }),
      isDeveloperMode: false
    })

    expect(result.xpAddresses).toEqual([])
    expect(result.xpAddressDictionary).toEqual({})
  })

  it('returns empty for non-primary Keystone accounts without hitting the lookup', async () => {
    const result = await getCachedXPAddresses({
      walletId: 'test-wallet-id',
      walletType: WalletType.KEYSTONE,
      account: createMockAccount({ index: 1 }),
      isDeveloperMode: false
    })

    expect(result.xpAddresses).toEqual([])
    expect(result.xpAddressDictionary).toEqual({})
    expect(mockFetchQuery).not.toHaveBeenCalled()
  })
})
