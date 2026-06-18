/**
 * Tests for the reconnection logic in ReactQueryProvider.
 *
 * Module-scope side effects (NetInfo.configure, onlineManager.setEventListener)
 * run on import.  We capture the callbacks from mocks to drive the tests.
 */

import { NetInfoState } from '@react-native-community/netinfo'

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any import that triggers side effects
// ---------------------------------------------------------------------------

let mockNetInfoListener: ((state: Partial<NetInfoState>) => void) | undefined
let mockSetOnlineFn: jest.Mock
let mockInvalidateQueries: jest.Mock

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    addEventListener: jest.fn((cb: (state: Partial<NetInfoState>) => void) => {
      mockNetInfoListener = cb
      return jest.fn() // unsubscribe
    })
  }
}))

jest.mock('@tanstack/react-query', () => {
  mockInvalidateQueries = jest.fn()
  return {
    QueryClient: jest.fn().mockImplementation(() => ({
      invalidateQueries: mockInvalidateQueries,
      setQueryData: jest.fn(),
      getQueryData: jest.fn()
    })),
    QueryCache: jest.fn(),
    focusManager: { setFocused: jest.fn() },
    onlineManager: {
      isOnline: jest.fn(),
      setEventListener: jest.fn(
        (cb: (setOnline: (v: boolean) => void) => () => void) => {
          mockSetOnlineFn = jest.fn()
          cb(mockSetOnlineFn)
        }
      )
    }
  }
})

jest.mock('@tanstack/react-query-persist-client', () => ({
  PersistQueryClientProvider: jest.fn(({ children }) => children),
  removeOldestQuery: jest.fn()
}))

jest.mock('@tanstack/query-sync-storage-persister', () => ({
  createSyncStoragePersister: jest.fn()
}))

jest.mock('utils/mmkv', () => ({
  queryStorage: {
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn()
  }
}))

jest.mock('hooks/networks/useNetworksListener', () => ({
  useNetworksListener: jest.fn()
}))

jest.mock('hooks/watchlist/useWatchlistListener', () => ({
  useWatchlistListener: jest.fn()
}))

// Mock the recurring-schedules listener — like the other listener mocks
// above, this is to keep `ReactQueryProvider`'s transitive import chain
// (`store/app` -> accountSettings store -> `ZustandStorageKeys`) out of the
// test environment, since `utils/mmkv` is mocked here to expose only
// `queryStorage`.
jest.mock(
  'features/recurringSwap/hooks/useRecurringSchedulesListener',
  () => ({
    useRecurringSchedulesListener: jest.fn()
  })
)

jest.mock('utils/Logger', () => ({
  error: jest.fn(),
  info: jest.fn()
}))

// ---------------------------------------------------------------------------
// Import triggers module-scope side effects
// ---------------------------------------------------------------------------

beforeAll(() => {
  require('./ReactQueryProvider')
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ReactQueryProvider connectivity handling', () => {
  beforeEach(() => {
    mockSetOnlineFn.mockClear()
    mockInvalidateQueries.mockClear()
  })

  // NOTE: tests share module-level `lastReachable` state and run in order.

  it('does nothing when isInternetReachable is null and isConnected is true', () => {
    // lastReachable starts as null after module import
    mockNetInfoListener?.({
      isInternetReachable: null,
      isConnected: true
    })

    expect(mockSetOnlineFn).not.toHaveBeenCalled()
  })

  it('sets online and invalidates queries on first reachability confirmation (null → true)', () => {
    // lastReachable is still null → first confirmation should invalidate
    mockNetInfoListener?.({
      isInternetReachable: true,
      isConnected: true
    })

    expect(mockSetOnlineFn).toHaveBeenCalledWith(true)
    expect(mockInvalidateQueries).toHaveBeenCalled()
  })

  it('does not invalidate queries when already online (true → true)', () => {
    // lastReachable is now true from previous test
    mockNetInfoListener?.({
      isInternetReachable: true,
      isConnected: true
    })

    expect(mockSetOnlineFn).toHaveBeenCalledWith(true)
    expect(mockInvalidateQueries).not.toHaveBeenCalled()
  })

  it('sets offline when isInternetReachable is false', () => {
    mockNetInfoListener?.({
      isInternetReachable: false,
      isConnected: true
    })

    expect(mockSetOnlineFn).toHaveBeenCalledWith(false)
  })

  it('invalidates queries on offline → online transition', () => {
    // lastReachable is now false from previous test
    mockNetInfoListener?.({
      isInternetReachable: true,
      isConnected: true
    })

    expect(mockInvalidateQueries).toHaveBeenCalled()
    expect(mockSetOnlineFn).toHaveBeenCalledWith(true)
  })

  it('sets offline when isConnected is false and isInternetReachable is null', () => {
    mockNetInfoListener?.({
      isInternetReachable: null,
      isConnected: false
    })

    expect(mockSetOnlineFn).toHaveBeenCalledWith(false)
  })
})
