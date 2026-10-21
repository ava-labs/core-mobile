import { providerErrors, rpcErrors } from '@metamask/rpc-errors'
import { CoreAccountType } from '@avalabs/types'
import { RpcMethod, RpcProvider, RpcRequest } from 'store/rpc/types'
import { AppListenerEffectAPI } from 'store/types'
import {
  UNSUPPORTED_WALLET_TYPE_ERROR,
  WalletType
} from 'services/wallet/types'
import AnalyticsService from 'services/analytics/AnalyticsService'
import Logger from 'utils/Logger'
import mockSession from 'tests/fixtures/walletConnect/session.json'
import { addAccount } from 'store/account/thunks'
import { VerifyContext } from 'store/rpc/handlers/wc_sessionRequest/utils'
import { avalancheAddAccountHandler as handler } from './avalanche_addAccount'

jest.mock('store/account/thunks', () => ({
  addAccount: jest.fn()
}))

jest.mock('services/analytics/AnalyticsService', () => ({
  __esModule: true,
  default: { capture: jest.fn() }
}))

jest.mock('utils/Logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), warn: jest.fn(), info: jest.fn() }
}))

const mockAddAccount = addAccount as jest.MockedFunction<typeof addAccount>
const walletId = 'wallet-1'

const buildState = ({
  walletType = WalletType.MNEMONIC,
  accounts = {
    'account-0': {
      id: 'account-0',
      index: 0,
      walletId,
      type: CoreAccountType.PRIMARY
    }
  },
  activeAccountId = 'account-0'
}: {
  walletType?: WalletType
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accounts?: Record<string, any>
  activeAccountId?: string
} = {}) => ({
  wallet: {
    wallets: {
      [walletId]: { id: walletId, name: 'Wallet', type: walletType }
    },
    activeWalletId: walletId
  },
  account: {
    accounts,
    activeAccountId
  }
})

const verifiedCoreContext = {
  verified: { origin: 'https://core.app', validation: 'VALID', verifyUrl: '' }
} as VerifyContext

const createRequest = (
  params: unknown,
  options: { provider?: RpcProvider; verifyContext?: VerifyContext } = {}
): RpcRequest<RpcMethod.AVALANCHE_ADD_ACCOUNT> => ({
  provider: options.provider ?? RpcProvider.WALLET_CONNECT,
  method: RpcMethod.AVALANCHE_ADD_ACCOUNT,
  data: {
    id: 1677366383831712,
    topic: '3a094bf511357e0f48ff266f0b8d5b846fd3f7de4bd0824d976fdf4c5279b261',
    params: {
      request: { method: RpcMethod.AVALANCHE_ADD_ACCOUNT, params },
      chainId: 'eip155:43113'
    },
    verifyContext:
      'verifyContext' in options ? options.verifyContext : verifiedCoreContext
  },
  peerMeta: mockSession.peer.metadata
})

describe('avalanche_addAccount handler', () => {
  let mockDispatch: jest.Mock
  let mockGetState: jest.Mock
  let mockListenerApi: AppListenerEffectAPI

  beforeEach(() => {
    jest.clearAllMocks()
    mockDispatch = jest.fn()
    mockGetState = jest.fn()
    mockListenerApi = {
      getState: mockGetState,
      dispatch: mockDispatch
    } as unknown as AppListenerEffectAPI
    mockAddAccount.mockReturnValue({ type: 'account/addAccount' } as never)
  })

  it('resolves { success: false } instead of throwing when the wallet is a Keystone wallet', async () => {
    mockGetState.mockReturnValue(
      buildState({ walletType: WalletType.KEYSTONE })
    )
    mockDispatch.mockReturnValue({
      // Matches RTK's `miniSerializeError` output — what unwrap() actually
      // throws for a thunk that rejects via a plain `throw new Error(...)`
      // (no rejectWithValue): a plain object, not an Error instance.
      unwrap: () =>
        Promise.reject({
          name: 'Error',
          message: UNSUPPORTED_WALLET_TYPE_ERROR,
          stack: 'Error: ' + UNSUPPORTED_WALLET_TYPE_ERROR
        })
    })

    const result = await handler.handle(
      createRequest([walletId]),
      mockListenerApi
    )

    expect(result).toEqual({
      success: false,
      error: rpcErrors.internal(UNSUPPORTED_WALLET_TYPE_ERROR)
    })
    expect(AnalyticsService.capture).not.toHaveBeenCalled()
    // Logger.error is Sentry-bound; a deliberately blocked wallet is not a bug.
    expect(Logger.warn).toHaveBeenCalled()
    expect(Logger.error).not.toHaveBeenCalled()
  })

  it('still logs genuine add-account failures at error level', async () => {
    mockGetState.mockReturnValue(buildState())
    mockDispatch.mockReturnValue({
      unwrap: () =>
        Promise.reject({
          name: 'Error',
          message: 'derivation blew up',
          stack: 'Error: derivation blew up'
        })
    })

    const result = await handler.handle(
      createRequest([walletId]),
      mockListenerApi
    )

    expect(result).toEqual({
      success: false,
      error: rpcErrors.internal('derivation blew up')
    })
    expect(Logger.error).toHaveBeenCalled()
    expect(Logger.warn).not.toHaveBeenCalled()
  })

  it('falls back to the generic message when the serialized error message is empty', async () => {
    mockGetState.mockReturnValue(buildState())
    mockDispatch.mockReturnValue({
      // Same miniSerializeError shape as above, but with a blank message —
      // must not surface an empty string to the dapp.
      unwrap: () => Promise.reject({ name: 'Error', message: '', stack: '' })
    })

    const result = await handler.handle(
      createRequest([walletId]),
      mockListenerApi
    )

    expect(result).toEqual({
      success: false,
      error: rpcErrors.internal('Failed to add account')
    })
  })

  it('still adds an account and returns the new active account id on the happy path', async () => {
    const updatedAccounts = {
      'account-0': {
        id: 'account-0',
        index: 0,
        walletId,
        type: CoreAccountType.PRIMARY
      },
      'account-1': {
        id: 'account-1',
        index: 1,
        walletId,
        type: CoreAccountType.PRIMARY
      }
    }
    mockGetState.mockReturnValueOnce(buildState()).mockReturnValueOnce(
      buildState({
        accounts: updatedAccounts,
        activeAccountId: 'account-1'
      })
    )
    mockDispatch.mockReturnValue({ unwrap: () => Promise.resolve() })

    const result = await handler.handle(
      createRequest([walletId]),
      mockListenerApi
    )

    expect(result).toEqual({ success: true, value: 'account-1' })
    expect(AnalyticsService.capture).toHaveBeenCalledWith(
      'CreatedANewAccountSuccessfully',
      { walletType: WalletType.MNEMONIC }
    )
  })

  const newAccountState = (): ReturnType<typeof buildState> =>
    buildState({
      accounts: {
        'account-0': {
          id: 'account-0',
          index: 0,
          walletId,
          type: CoreAccountType.PRIMARY
        },
        'account-1': {
          id: 'account-1',
          index: 1,
          walletId,
          type: CoreAccountType.PRIMARY
        }
      },
      activeAccountId: 'account-1'
    })

  it('adds an account for a verified Core domain over WalletConnect', async () => {
    mockGetState
      .mockReturnValueOnce(buildState())
      .mockReturnValueOnce(newAccountState())
    mockDispatch.mockReturnValue({ unwrap: () => Promise.resolve() })

    const result = await handler.handle(
      createRequest([walletId]),
      mockListenerApi
    )

    expect(mockAddAccount).toHaveBeenCalledWith(walletId)
    expect(result).toEqual({ success: true, value: 'account-1' })
  })

  it('rejects an unverified WalletConnect request without adding an account', async () => {
    mockGetState.mockReturnValue(buildState())
    const unverified = {
      verified: {
        origin: 'https://core.app',
        validation: 'UNKNOWN',
        verifyUrl: ''
      }
    } as VerifyContext

    for (const verifyContext of [unverified, undefined]) {
      const result = await handler.handle(
        createRequest([walletId], { verifyContext }),
        mockListenerApi
      )

      expect(result).toEqual({
        success: false,
        error: providerErrors.unauthorized(
          'Request is not from a verified Core domain'
        )
      })
    }
    expect(mockAddAccount).not.toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalled()
    expect(Logger.warn).toHaveBeenCalledTimes(2)
  })

  it('adds an account for an in-app request without a verify context', async () => {
    mockGetState
      .mockReturnValueOnce(buildState())
      .mockReturnValueOnce(newAccountState())
    mockDispatch.mockReturnValue({ unwrap: () => Promise.resolve() })

    const result = await handler.handle(
      createRequest([walletId], {
        provider: RpcProvider.CORE_MOBILE,
        verifyContext: undefined
      }),
      mockListenerApi
    )

    expect(mockAddAccount).toHaveBeenCalledWith(walletId)
    expect(result).toEqual({ success: true, value: 'account-1' })
  })
})
