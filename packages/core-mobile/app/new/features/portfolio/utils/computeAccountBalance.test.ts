import { AdjustedNormalizedBalancesForAccount } from 'services/balance/types'
import { Networks } from 'store/network/types'
import { TokenVisibility } from 'store/portfolio'
import { computeAccountBalance } from './computeAccountBalance'

const makeToken = (overrides: Record<string, unknown> = {}) => ({
  localId: 'token-1',
  networkChainId: 43114,
  balanceInCurrency: 100,
  ...overrides
})

const makeBalance = (
  overrides: Partial<AdjustedNormalizedBalancesForAccount> = {}
): AdjustedNormalizedBalancesForAccount => ({
  accountId: 'account-1',
  chainId: 43114,
  tokens: [makeToken()] as never[],
  dataAccurate: true,
  error: null,
  ...overrides
})

const defaultNetworksMap: Networks = {
  43114: { isTestnet: false } as never,
  43113: { isTestnet: true } as never
}

const defaultParams = {
  accountBalances: [] as AdjustedNormalizedBalancesForAccount[],
  enabledNetworksCount: 2,
  enabledNetworksMap: defaultNetworksMap,
  enabledChainIds: [43114, 43113],
  isDeveloperMode: false,
  tokenVisibility: {} as TokenVisibility,
  isError: false
}

describe('computeAccountBalance', () => {
  describe('isLoadingBalance', () => {
    it('returns false when enabledNetworksCount is 0 (account supports no enabled networks)', () => {
      // CP-14303: when an account cannot produce balance entries for any
      // enabled network (e.g. all unsupported by the wallet type) we should
      // show $0 instead of spinning forever.
      const result = computeAccountBalance({
        ...defaultParams,
        enabledNetworksCount: 0
      })
      expect(result.isLoadingBalance).toBe(false)
    })

    it('returns false when isError is true', () => {
      const result = computeAccountBalance({
        ...defaultParams,
        isError: true
      })
      expect(result.isLoadingBalance).toBe(false)
    })

    it('returns true when accountBalances is empty', () => {
      const result = computeAccountBalance({
        ...defaultParams,
        accountBalances: []
      })
      expect(result.isLoadingBalance).toBe(true)
    })

    it('returns true when balances count < enabledNetworksCount (partial loading)', () => {
      const result = computeAccountBalance({
        ...defaultParams,
        enabledNetworksCount: 3,
        accountBalances: [makeBalance(), makeBalance({ chainId: 43113 })]
      })
      expect(result.isLoadingBalance).toBe(true)
    })

    it('returns false when all enabled networks have loaded', () => {
      const result = computeAccountBalance({
        ...defaultParams,
        enabledNetworksCount: 2,
        accountBalances: [makeBalance(), makeBalance({ chainId: 43113 })]
      })
      expect(result.isLoadingBalance).toBe(false)
    })

    it('returns false when enabledNetworksCount excludes an unsupported network (Keystone + SVM)', () => {
      // CP-14303: Keystone wallets can never produce a Solana balance entry,
      // so the wallet card considers the account loaded once it has the
      // entries it actually supports — even if the globally enabled set is
      // larger.
      const result = computeAccountBalance({
        ...defaultParams,
        enabledNetworksCount: 2,
        accountBalances: [makeBalance(), makeBalance({ chainId: 43113 })]
      })
      expect(result.isLoadingBalance).toBe(false)
    })
  })

  describe('hasBalanceData', () => {
    it('returns false for empty balances', () => {
      const result = computeAccountBalance(defaultParams)
      expect(result.hasBalanceData).toBe(false)
    })

    it('returns true when balances exist', () => {
      const result = computeAccountBalance({
        ...defaultParams,
        accountBalances: [makeBalance()]
      })
      expect(result.hasBalanceData).toBe(true)
    })
  })

  describe('dataAccurate', () => {
    it('returns true for empty balances (vacuous truth)', () => {
      const result = computeAccountBalance(defaultParams)
      expect(result.dataAccurate).toBe(true)
    })

    it('returns true when all balances are accurate', () => {
      const result = computeAccountBalance({
        ...defaultParams,
        accountBalances: [
          makeBalance({ dataAccurate: true }),
          makeBalance({ dataAccurate: true })
        ]
      })
      expect(result.dataAccurate).toBe(true)
    })

    it('returns false when any balance is inaccurate', () => {
      const result = computeAccountBalance({
        ...defaultParams,
        accountBalances: [
          makeBalance({ dataAccurate: true }),
          makeBalance({ dataAccurate: false })
        ]
      })
      expect(result.dataAccurate).toBe(false)
    })
  })

  describe('error', () => {
    it('returns null when no errors', () => {
      const result = computeAccountBalance({
        ...defaultParams,
        accountBalances: [makeBalance()]
      })
      expect(result.error).toBeNull()
    })

    it('returns first error message found', () => {
      const result = computeAccountBalance({
        ...defaultParams,
        accountBalances: [
          makeBalance({ error: { error: 'network timeout' } }),
          makeBalance({ error: { error: 'other error' } })
        ]
      })
      expect(result.error).toBe('network timeout')
    })

    it('returns null for empty balances', () => {
      const result = computeAccountBalance(defaultParams)
      expect(result.error).toBeNull()
    })
  })

  describe('balance calculation', () => {
    it('returns 0 for empty balances', () => {
      const result = computeAccountBalance(defaultParams)
      expect(result.balance).toBe(0)
    })

    it('sums balanceInCurrency across tokens', () => {
      const result = computeAccountBalance({
        ...defaultParams,
        accountBalances: [
          makeBalance({
            tokens: [
              makeToken({ balanceInCurrency: 50 }),
              makeToken({ balanceInCurrency: 30, localId: 'token-2' })
            ] as never[]
          })
        ]
      })
      expect(result.balance).toBe(80)
    })

    it('treats null balanceInCurrency as 0', () => {
      const result = computeAccountBalance({
        ...defaultParams,
        accountBalances: [
          makeBalance({
            tokens: [makeToken({ balanceInCurrency: null })] as never[]
          })
        ]
      })
      expect(result.balance).toBe(0)
    })
  })

  describe('dev/testnet filtering', () => {
    it('excludes testnet balances in production mode', () => {
      const result = computeAccountBalance({
        ...defaultParams,
        isDeveloperMode: false,
        accountBalances: [
          makeBalance({
            chainId: 43114,
            tokens: [makeToken({ balanceInCurrency: 100 })] as never[]
          }),
          makeBalance({
            chainId: 43113,
            tokens: [
              makeToken({ balanceInCurrency: 50, networkChainId: 43113 })
            ] as never[]
          })
        ]
      })
      expect(result.balance).toBe(100)
    })

    it('includes only testnet balances in developer mode', () => {
      const result = computeAccountBalance({
        ...defaultParams,
        isDeveloperMode: true,
        enabledChainIds: [43113],
        accountBalances: [
          makeBalance({
            chainId: 43114,
            tokens: [makeToken({ balanceInCurrency: 100 })] as never[]
          }),
          makeBalance({
            chainId: 43113,
            tokens: [
              makeToken({ balanceInCurrency: 50, networkChainId: 43113 })
            ] as never[]
          })
        ]
      })
      expect(result.balance).toBe(50)
    })
  })

  describe('enabledChainIds filtering', () => {
    it('excludes tokens not in enabledChainIds', () => {
      const result = computeAccountBalance({
        ...defaultParams,
        enabledChainIds: [43114],
        accountBalances: [
          makeBalance({
            tokens: [
              makeToken({ balanceInCurrency: 100, networkChainId: 43114 }),
              makeToken({ balanceInCurrency: 50, networkChainId: 1 })
            ] as never[]
          })
        ]
      })
      expect(result.balance).toBe(100)
    })
  })

  describe('token visibility filtering', () => {
    it('excludes hidden tokens', () => {
      const result = computeAccountBalance({
        ...defaultParams,
        tokenVisibility: { 'token-hidden': false },
        accountBalances: [
          makeBalance({
            tokens: [
              makeToken({
                balanceInCurrency: 100,
                localId: 'token-visible'
              }),
              makeToken({
                balanceInCurrency: 50,
                localId: 'token-hidden'
              })
            ] as never[]
          })
        ]
      })
      expect(result.balance).toBe(100)
    })
  })

  describe('unknown network in networksMap', () => {
    it('excludes balances with chainId not in networksMap', () => {
      const result = computeAccountBalance({
        ...defaultParams,
        enabledNetworksMap: { 43114: { isTestnet: false } as never },
        accountBalances: [
          makeBalance({
            chainId: 43114,
            tokens: [makeToken({ balanceInCurrency: 100 })] as never[]
          }),
          makeBalance({
            chainId: 99999,
            tokens: [
              makeToken({ balanceInCurrency: 50, networkChainId: 99999 })
            ] as never[]
          })
        ]
      })
      expect(result.balance).toBe(100)
    })
  })
})
