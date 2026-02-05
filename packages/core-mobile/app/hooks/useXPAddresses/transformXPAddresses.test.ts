import { Account } from 'store/account/types'
import { CoreAccountType } from '@avalabs/types'
import { transformXPAddresses } from './transformXPAddresses'

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

describe('transformXPAddresses', () => {
  describe('when queryData has both xpAddresses and xpAddressDictionary', () => {
    it('returns data from queryData', () => {
      const queryData = {
        xpAddresses: [
          { address: 'avax1aaa' },
          { address: 'avax1bbb' },
          { address: 'avax1ccc' }
        ],
        xpAddressDictionary: {
          avax1aaa: { space: 'e' as const, index: 0, hasActivity: true },
          avax1bbb: { space: 'e' as const, index: 1, hasActivity: true },
          avax1ccc: { space: 'i' as const, index: 0, hasActivity: false }
        }
      }
      const account = createMockAccount()

      const result = transformXPAddresses(queryData, account)

      expect(result.xpAddresses).toEqual(['avax1aaa', 'avax1bbb', 'avax1ccc'])
      expect(result.xpAddressDictionary).toEqual(queryData.xpAddressDictionary)
    })
  })

  describe('when queryData is undefined', () => {
    it('falls back to account.addressPVM', () => {
      const account = createMockAccount({
        addressPVM: 'P-avax1fallback'
      })

      const result = transformXPAddresses(undefined, account)

      expect(result.xpAddresses).toEqual(['avax1fallback'])
      expect(result.xpAddressDictionary).toEqual({
        avax1fallback: {
          space: 'e',
          index: 0,
          hasActivity: false
        }
      })
    })
  })

  describe('when queryData.xpAddresses is empty', () => {
    it('falls back to account.addressPVM for xpAddresses', () => {
      const queryData = {
        xpAddresses: [],
        xpAddressDictionary: {
          avax1existing: { space: 'e' as const, index: 0, hasActivity: true }
        }
      }
      const account = createMockAccount({
        addressPVM: 'P-avax1fallback'
      })

      const result = transformXPAddresses(queryData, account)

      expect(result.xpAddresses).toEqual(['avax1fallback'])
      expect(result.xpAddressDictionary).toEqual(queryData.xpAddressDictionary)
    })
  })

  describe('when queryData.xpAddressDictionary is missing', () => {
    it('falls back to account.addressPVM for dictionary', () => {
      const queryData = {
        xpAddresses: [{ address: 'avax1aaa' }, { address: 'avax1bbb' }]
      }
      const account = createMockAccount({
        addressPVM: 'P-avax1fallback'
      })

      const result = transformXPAddresses(queryData, account)

      expect(result.xpAddresses).toEqual(['avax1aaa', 'avax1bbb'])
      expect(result.xpAddressDictionary).toEqual({
        avax1fallback: {
          space: 'e',
          index: 0,
          hasActivity: false
        }
      })
    })
  })

  describe('when queryData has only xpAddressDictionary', () => {
    it('falls back to account.addressPVM for xpAddresses', () => {
      const queryData = {
        xpAddressDictionary: {
          avax1dict: { space: 'e' as const, index: 0, hasActivity: true }
        }
      }
      const account = createMockAccount({
        addressPVM: 'P-avax1fallback'
      })

      const result = transformXPAddresses(queryData, account)

      expect(result.xpAddresses).toEqual(['avax1fallback'])
      expect(result.xpAddressDictionary).toEqual(queryData.xpAddressDictionary)
    })
  })

  describe('when both queryData and account are undefined', () => {
    it('returns empty arrays', () => {
      const result = transformXPAddresses(undefined, undefined)

      expect(result.xpAddresses).toEqual([])
      expect(result.xpAddressDictionary).toEqual({})
    })
  })

  describe('when account has no addressPVM', () => {
    it('returns empty arrays when queryData is also empty', () => {
      const account = createMockAccount({
        addressPVM: undefined
      })

      const result = transformXPAddresses(undefined, account)

      expect(result.xpAddresses).toEqual([])
      expect(result.xpAddressDictionary).toEqual({})
    })

    it('returns queryData when provided', () => {
      const queryData = {
        xpAddresses: [{ address: 'avax1test' }],
        xpAddressDictionary: {
          avax1test: { space: 'e' as const, index: 0, hasActivity: true }
        }
      }
      const account = createMockAccount({
        addressPVM: undefined
      })

      const result = transformXPAddresses(queryData, account)

      expect(result.xpAddresses).toEqual(['avax1test'])
      expect(result.xpAddressDictionary).toEqual(queryData.xpAddressDictionary)
    })
  })

  describe('strips P- prefix from account.addressPVM', () => {
    it('handles P-prefixed addresses', () => {
      const account = createMockAccount({
        addressPVM: 'P-avax1withprefix'
      })

      const result = transformXPAddresses(undefined, account)

      expect(result.xpAddresses).toEqual(['avax1withprefix'])
      expect(result.xpAddressDictionary).toHaveProperty('avax1withprefix')
    })

    it('handles addresses without prefix', () => {
      const account = createMockAccount({
        addressPVM: 'avax1noprefix'
      })

      const result = transformXPAddresses(undefined, account)

      expect(result.xpAddresses).toEqual(['avax1noprefix'])
      expect(result.xpAddressDictionary).toHaveProperty('avax1noprefix')
    })
  })

  describe('dictionary fallback properties', () => {
    it('creates fallback dictionary with space=e, index=0, hasActivity=false', () => {
      const account = createMockAccount({
        addressPVM: 'P-avax1test'
      })

      const result = transformXPAddresses(undefined, account)

      expect(result.xpAddressDictionary.avax1test).toEqual({
        space: 'e',
        index: 0,
        hasActivity: false
      })
    })
  })

  describe('xpAddresses array transformation', () => {
    it('extracts address property from objects', () => {
      const queryData = {
        xpAddresses: [
          { address: 'avax1first' },
          { address: 'avax1second' },
          { address: 'avax1third' }
        ]
      }
      const account = createMockAccount()

      const result = transformXPAddresses(queryData, account)

      expect(result.xpAddresses).toEqual([
        'avax1first',
        'avax1second',
        'avax1third'
      ])
    })

    it('preserves order of addresses', () => {
      const queryData = {
        xpAddresses: [
          { address: 'avax1zzz' },
          { address: 'avax1aaa' },
          { address: 'avax1mmm' }
        ]
      }
      const account = createMockAccount()

      const result = transformXPAddresses(queryData, account)

      expect(result.xpAddresses).toEqual(['avax1zzz', 'avax1aaa', 'avax1mmm'])
    })
  })
})
