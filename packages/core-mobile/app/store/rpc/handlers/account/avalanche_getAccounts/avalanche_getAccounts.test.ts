import { RpcMethod, RpcProvider, RpcRequest } from 'store/rpc/types'
import mockSession from 'tests/fixtures/walletConnect/session.json'
import mockAccounts from 'tests/fixtures/accounts.json'
import { avalancheGetAccountsHandler as handler } from './avalanche_getAccounts'

jest.mock('store/account/slice', () => {
  const actual = jest.requireActual('store/account/slice')
  return {
    ...actual,
    selectAccountsByWalletId: () => Object.values(mockAccounts),
    selectActiveAccount: () => mockAccounts['0']
  }
})

jest.mock('store/wallet/slice', () => ({
  selectWalletById: () => () => ({
    id: 'wallet-1',
    name: 'Test Wallet',
    type: 'MNEMONIC'
  })
}))

jest.mock('services/wallet/WalletService', () => ({
  __esModule: true,
  default: {
    getRawXpubXP: jest
      .fn()
      .mockResolvedValue(
        'xpub6D4BDPcP2GT577Vvch3R8wDkScZWzQzMMUm3PWbmWvVJrZwQY4VUNgqFJPMM3No2dFDFGTsxxpG5uJh7n7epu4trkrX7x7DogT5Uv6fcLW5'
      )
  }
}))

const mockGetSession = jest.fn()
jest.mock('services/walletconnectv2/WalletConnectService', () => ({
  __esModule: true,
  default: {
    getSession: (topic: string) => mockGetSession(topic)
  }
}))

jest.mock('utils/Logger', () => ({
  warn: jest.fn()
}))

jest.mock('store/settings/advanced', () => ({
  selectIsDeveloperMode: () => false
}))

jest.mock('hooks/useXPAddresses/useXPAddresses', () => ({
  getCachedXPAddresses: jest.fn().mockResolvedValue({
    xpAddresses: ['avax1test1', 'avax1test2'],
    xpAddressDictionary: {
      avax1test1: { space: 'e', index: 0, hasActivity: true },
      avax1test2: { space: 'e', index: 1, hasActivity: true }
    }
  })
}))

const mockDispatch = jest.fn()
const mockListenerApi = {
  getState: jest.fn(),
  dispatch: mockDispatch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any

const testMethod = RpcMethod.AVALANCHE_GET_ACCOUNTS

const testRequest: RpcRequest<RpcMethod.AVALANCHE_GET_ACCOUNTS> = {
  provider: RpcProvider.WALLET_CONNECT,
  method: testMethod,
  data: {
    id: 1677366383831712,
    topic: '3a094bf511357e0f48ff266f0b8d5b846fd3f7de4bd0824d976fdf4c5279b261',
    params: {
      request: {
        method: testMethod,
        params: {}
      },
      chainId: 'eip155:43113'
    }
  },
  peerMeta: mockSession.peer.metadata
}

const ACCOUNT_1_C = '0xcA0E993876152ccA6053eeDFC753092c8cE712D0'
const ACCOUNT_2_C = '0xC7E5ffBd7843EdB88cCB2ebaECAa07EC55c65318'

const sessionApproving = (...addresses: string[]): unknown => ({
  ...mockSession,
  namespaces: {
    eip155: {
      ...mockSession.namespaces.eip155,
      accounts: addresses.map(address => `eip155:43114:${address}`)
    }
  }
})

const withVerify = (
  validation: 'VALID' | 'UNKNOWN' | 'INVALID',
  origin: string
): RpcRequest<RpcMethod.AVALANCHE_GET_ACCOUNTS> => ({
  ...testRequest,
  data: {
    ...testRequest.data,
    verifyContext: { verified: { validation, origin, verifyUrl: '' } }
  }
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ids = (result: any): string[] =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result.success ? result.value.map((a: any) => a.id) : []

describe('avalanche_getAccounts handler', () => {
  beforeEach(() => {
    mockGetSession.mockReset()
    mockGetSession.mockReturnValue(mockSession)
  })

  it('should contain correct methods', () => {
    expect(handler.methods).toEqual(['avalanche_getAccounts'])
  })

  describe('handle', () => {
    it('should return success with the list of available accounts including xpubXP for mnemonic wallets', async () => {
      const result = await handler.handle(testRequest, mockListenerApi)

      expect(result).toEqual({
        success: true,
        value: [
          {
            id: '0',
            index: 0,
            name: 'Account 1',
            addressAVM: 'X-fuji1e0r9s2lf6v9mfqyy6pxrpkar8dm5jxqcvhg99n',
            addressBTC: 'tb1qlzsvluv4cahzz8zzwud40x2hn3zq4c7zak6spw',
            addressC: '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
            addressPVM: 'P-fuji1e0r9s2lf6v9mfqyy6pxrpkar8dm5jxqcvhg99n',
            addressSVM: '9gQmZ7fTTgv5hVScrr9QqT6SpBs7i4cKLDdj4tuae3sW',
            addressCoreEth: 'C-fuji1y76a8lk4ym3af4u45f7fghuqc6ftfh7l4jsrgz',
            active: true,
            type: 'primary',
            walletId: 'wallet-1',
            walletType: 'MNEMONIC',
            walletName: 'Test Wallet',
            xpubXP:
              'xpub6D4BDPcP2GT577Vvch3R8wDkScZWzQzMMUm3PWbmWvVJrZwQY4VUNgqFJPMM3No2dFDFGTsxxpG5uJh7n7epu4trkrX7x7DogT5Uv6fcLW5',
            xpAddresses: [
              { address: 'avax1test1', index: 0 },
              { address: 'avax1test2', index: 1 }
            ]
          },
          {
            id: '1',
            index: 1,
            name: 'Account 2',
            addressBTC: 'tb1qjmapax0vtca726g8kaermd5rzdljql66esxs49',
            addressC: '0xC7E5ffBd7843EdB88cCB2ebaECAa07EC55c65318',
            addressAVM: 'X-fuji1e0r8s2lf6v9mfqyy6pxrpkar8dm5jxqcvhg99n',
            addressCoreEth: 'C-fuji1y78a8lk4ym3af4u45f7fghuqc6ftfh7l4jsrgz',
            addressPVM: 'P-fuji1e0r8s2lf6v9mfqyy6pxrpkar8dm5jxqcvhg99n',
            addressSVM: '9gQmZ7fTTgv5hVScrr9QqT6SpBs7i4cKLDdj8tuae5sW',
            active: false,
            type: 'primary',
            walletId: 'wallet-1',
            walletType: 'MNEMONIC',
            walletName: 'Test Wallet',
            xpubXP:
              'xpub6D4BDPcP2GT577Vvch3R8wDkScZWzQzMMUm3PWbmWvVJrZwQY4VUNgqFJPMM3No2dFDFGTsxxpG5uJh7n7epu4trkrX7x7DogT5Uv6fcLW5',
            xpAddresses: [
              { address: 'avax1test1', index: 0 },
              { address: 'avax1test2', index: 1 }
            ]
          }
        ]
      })
    })

    it('should return accounts without xpubXP for non-supported wallet types', async () => {
      // Mock a Ledger wallet (doesn't support xpubXP)
      const mockWalletSlice = require('store/wallet/slice')
      mockWalletSlice.selectWalletById = () => () => ({
        id: 'wallet-1',
        name: 'Ledger Wallet',
        type: 'LEDGER'
      })

      // Mock WalletService to throw error for Ledger wallets
      const mockWalletService = require('services/wallet/WalletService')
      mockWalletService.default.getRawXpubXP.mockRejectedValueOnce(
        new Error('Unsupported wallet type')
      )

      const result = await handler.handle(testRequest, mockListenerApi)

      expect(result.success).toBe(true)
      if (result.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const accounts = result.value as any[]
        expect(accounts).toHaveLength(2)
        expect(accounts[0].xpubXP).toBeUndefined()
        expect(accounts[0].walletType).toBe('LEDGER')
        expect(accounts[0].walletName).toBe('Ledger Wallet')
        expect(accounts[0].xpAddresses).toEqual([
          { address: 'avax1test1', index: 0 },
          { address: 'avax1test2', index: 1 }
        ])
      }
    })
  })
  describe('account scope', () => {
    it('returns only the session-approved accounts to an unverified WalletConnect peer', async () => {
      mockGetSession.mockReturnValue(sessionApproving(ACCOUNT_1_C))
      const result = await handler.handle(testRequest, mockListenerApi)
      expect(ids(result)).toEqual(['0'])
    })

    it('returns only the session-approved accounts to a peer claiming the Core extension', async () => {
      mockGetSession.mockReturnValue(sessionApproving(ACCOUNT_2_C))
      const result = await handler.handle(
        withVerify(
          'UNKNOWN',
          'chrome-extension://agoakfejjabomempkjlepdflaleeobhb'
        ),
        mockListenerApi
      )
      expect(ids(result)).toEqual(['1'])
    })

    it('returns the whole wallet to a Verify-attested Core app', async () => {
      mockGetSession.mockReturnValue(sessionApproving(ACCOUNT_1_C))
      const result = await handler.handle(
        withVerify('VALID', 'https://core.app'),
        mockListenerApi
      )
      expect(ids(result)).toEqual(['0', '1'])
    })

    it('scopes a Core domain to the session when Verify does not attest it', async () => {
      mockGetSession.mockReturnValue(sessionApproving(ACCOUNT_1_C))
      const result = await handler.handle(
        withVerify('UNKNOWN', 'https://core.app'),
        mockListenerApi
      )
      expect(ids(result)).toEqual(['0'])
    })

    it('returns the whole wallet to in-app requests without a session lookup', async () => {
      const result = await handler.handle(
        { ...testRequest, provider: RpcProvider.CORE_MOBILE },
        mockListenerApi
      )
      expect(ids(result)).toEqual(['0', '1'])
      expect(mockGetSession).not.toHaveBeenCalled()
    })

    it('refuses a WalletConnect request with no session', async () => {
      mockGetSession.mockReturnValue(undefined)
      const result = await handler.handle(testRequest, mockListenerApi)
      expect(result.success).toBe(false)
    })
  })
})
