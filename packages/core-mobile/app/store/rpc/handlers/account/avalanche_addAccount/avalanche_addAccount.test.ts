import { rpcErrors } from '@metamask/rpc-errors'
import { CoreAccountType } from '@avalabs/types'
import { RpcMethod, RpcProvider, RpcRequest } from 'store/rpc/types'
import { AppListenerEffectAPI } from 'store/types'
import {
  UNSUPPORTED_WALLET_TYPE_ERROR,
  WalletType
} from 'services/wallet/types'
import AnalyticsService from 'services/analytics/AnalyticsService'
import mockSession from 'tests/fixtures/walletConnect/session.json'
import { addAccount } from 'store/account/thunks'
import { avalancheAddAccountHandler as handler } from './avalanche_addAccount'

jest.mock('store/account/thunks', () => ({
  addAccount: jest.fn()
}))

jest.mock('services/analytics/AnalyticsService', () => ({
  __esModule: true,
  default: { capture: jest.fn() }
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

const createRequest = (
  params: unknown
): RpcRequest<RpcMethod.AVALANCHE_ADD_ACCOUNT> => ({
  provider: RpcProvider.WALLET_CONNECT,
  method: RpcMethod.AVALANCHE_ADD_ACCOUNT,
  data: {
    id: 1677366383831712,
    topic: '3a094bf511357e0f48ff266f0b8d5b846fd3f7de4bd0824d976fdf4c5279b261',
    params: {
      request: { method: RpcMethod.AVALANCHE_ADD_ACCOUNT, params },
      chainId: 'eip155:43113'
    }
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
})
