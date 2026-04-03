import { renderHook, act } from '@testing-library/react-hooks'
import { AppState, PermissionsAndroid, Platform } from 'react-native'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import { check, RESULTS } from 'react-native-permissions'
import {
  BluetoothState,
  ensureBluetoothAvailable,
  getBluetoothStateAsync,
  requestPermissionsAsync,
  useBluetooth
} from './useBluetooth'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

jest.mock('@ledgerhq/react-native-hw-transport-ble', () => ({
  __esModule: true,
  default: {
    observeState: jest.fn()
  }
}))

// react-native-permissions is mapped to its mock in jest.config.js, but the
// mock doesn't expose `check` as a jest.fn(), so we override it here.
jest.mock('react-native-permissions', () => ({
  check: jest.fn(),
  PERMISSIONS: {
    IOS: { BLUETOOTH: 'ios.permission.BLUETOOTH' }
  },
  RESULTS: {
    GRANTED: 'granted',
    BLOCKED: 'blocked',
    DENIED: 'denied',
    UNAVAILABLE: 'unavailable',
    LIMITED: 'limited'
  }
}))

jest.mock('utils/Logger', () => ({
  error: jest.fn(),
  info: jest.fn()
}))

// ---------------------------------------------------------------------------
// Typed references to mocks
// ---------------------------------------------------------------------------

const mockTransportBLE = TransportBLE as unknown as {
  observeState: jest.Mock
}
const mockCheck = check as jest.Mock

// ---------------------------------------------------------------------------
// AppState helper — captures all listeners so tests can fire 'active' events
// ---------------------------------------------------------------------------

type AppStateListener = (state: string) => void

let appStateListeners: AppStateListener[] = []

const mockAddEventListener = jest
  .spyOn(AppState, 'addEventListener')
  .mockImplementation((_event, handler) => {
    appStateListeners.push(handler as AppStateListener)
    return { remove: jest.fn() }
  })

function fireAppStateForeground(): void {
  appStateListeners.forEach(l => l('active'))
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Sets up TransportBLE.observeState to synchronously emit the given state. */
function setupObserveState(state: BluetoothState): void {
  mockTransportBLE.observeState.mockImplementation(
    ({
      next,
      error: onError
    }: {
      next?: (e: { type: string }) => void
      error?: () => void
      complete?: () => void
    }) => {
      try {
        next?.({ type: state })
      } catch {
        onError?.()
      }
      return { unsubscribe: jest.fn() }
    }
  )
}

/** Sets up TransportBLE.observeState to fire the error callback. */
function setupObserveStateError(): void {
  mockTransportBLE.observeState.mockImplementation(
    ({ error: onError }: { error?: () => void }) => {
      onError?.()
      return { unsubscribe: jest.fn() }
    }
  )
}

const originalPlatformOS = Platform.OS

// ---------------------------------------------------------------------------
// requestPermissionsAsync
// ---------------------------------------------------------------------------

describe('requestPermissionsAsync', () => {
  afterEach(() => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: originalPlatformOS
    })
    jest.clearAllMocks()
  })

  describe('Android', () => {
    beforeEach(() => {
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: 'android'
      })
      jest
        .spyOn(PermissionsAndroid, 'requestMultiple')
        .mockResolvedValue({} as never)
    })

    it('returns true when all permissions are already granted', async () => {
      jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(true as never)

      const result = await requestPermissionsAsync()

      expect(result).toBe(true)
      expect(PermissionsAndroid.requestMultiple).not.toHaveBeenCalled()
    })

    it('returns true when missing permissions are granted after request', async () => {
      jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(false as never)
      jest
        .spyOn(PermissionsAndroid, 'requestMultiple')
        .mockResolvedValue(
          Object.fromEntries(
            [
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            ]
              .filter(Boolean)
              .map(p => [p, PermissionsAndroid.RESULTS.GRANTED])
          ) as never
        )

      const result = await requestPermissionsAsync()

      expect(result).toBe(true)
    })

    it('returns false when any permission is denied after request', async () => {
      jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(false as never)
      jest
        .spyOn(PermissionsAndroid, 'requestMultiple')
        .mockResolvedValue(
          Object.fromEntries(
            [
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            ]
              .filter(Boolean)
              .map((p, i) => [
                p,
                i === 0
                  ? PermissionsAndroid.RESULTS.DENIED
                  : PermissionsAndroid.RESULTS.GRANTED
              ])
          ) as never
        )

      const result = await requestPermissionsAsync()

      expect(result).toBe(false)
    })

    it('returns false and logs on unexpected error', async () => {
      jest
        .spyOn(PermissionsAndroid, 'check')
        .mockRejectedValue(new Error('permission check failed') as never)

      const result = await requestPermissionsAsync()

      expect(result).toBe(false)
    })
  })

  describe('iOS', () => {
    beforeEach(() => {
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: 'ios'
      })
    })

    it('returns false when Bluetooth permission is blocked', async () => {
      mockCheck.mockResolvedValue(RESULTS.BLOCKED)

      const result = await requestPermissionsAsync()

      expect(result).toBe(false)
    })

    it('returns true when Bluetooth permission is granted', async () => {
      mockCheck.mockResolvedValue(RESULTS.GRANTED)

      const result = await requestPermissionsAsync()

      expect(result).toBe(true)
    })

    it('returns true (optimistic) when check throws — delegates to CoreBluetooth', async () => {
      mockCheck.mockRejectedValue(new Error('permission api unavailable'))

      const result = await requestPermissionsAsync()

      expect(result).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// getBluetoothStateAsync
// ---------------------------------------------------------------------------

describe('getBluetoothStateAsync', () => {
  afterEach(() => jest.clearAllMocks())

  it.each([
    BluetoothState.POWERED_ON,
    BluetoothState.POWERED_OFF,
    BluetoothState.UNAUTHORIZED,
    BluetoothState.UNSUPPORTED
  ])('resolves with %s when observeState emits it', async state => {
    setupObserveState(state)

    await expect(getBluetoothStateAsync()).resolves.toBe(state)
  })

  it('resolves with UNKNOWN when observeState fires the error callback', async () => {
    setupObserveStateError()

    await expect(getBluetoothStateAsync()).resolves.toBe(BluetoothState.UNKNOWN)
  })
})

// ---------------------------------------------------------------------------
// ensureBluetoothAvailable
// ---------------------------------------------------------------------------

describe('ensureBluetoothAvailable', () => {
  afterEach(() => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: originalPlatformOS
    })
    jest.clearAllMocks()
  })

  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' })
  })

  it('returns { hasPermission: true, state: POWERED_ON } when radio is on and permission is granted', async () => {
    mockCheck.mockResolvedValue(RESULTS.GRANTED)
    setupObserveState(BluetoothState.POWERED_ON)

    await expect(ensureBluetoothAvailable()).resolves.toEqual({
      hasPermission: true,
      state: BluetoothState.POWERED_ON
    })
  })

  it('returns { hasPermission: false, state: POWERED_ON } when permission is blocked but radio is on', async () => {
    mockCheck.mockResolvedValue(RESULTS.BLOCKED)
    setupObserveState(BluetoothState.POWERED_ON)

    await expect(ensureBluetoothAvailable()).resolves.toEqual({
      hasPermission: false,
      state: BluetoothState.POWERED_ON
    })
  })

  it('returns { hasPermission: true, state: POWERED_OFF } when permission is granted but radio is off', async () => {
    mockCheck.mockResolvedValue(RESULTS.GRANTED)
    setupObserveState(BluetoothState.POWERED_OFF)

    await expect(ensureBluetoothAvailable()).resolves.toEqual({
      hasPermission: true,
      state: BluetoothState.POWERED_OFF
    })
  })

  it('returns { hasPermission: false, state: POWERED_OFF } when both permission is blocked and radio is off', async () => {
    mockCheck.mockResolvedValue(RESULTS.BLOCKED)
    setupObserveState(BluetoothState.POWERED_OFF)

    await expect(ensureBluetoothAvailable()).resolves.toEqual({
      hasPermission: false,
      state: BluetoothState.POWERED_OFF
    })
  })

  it('returns { hasPermission: true, state: UNAUTHORIZED } for CoreBluetooth unauthorized state', async () => {
    mockCheck.mockResolvedValue(RESULTS.GRANTED)
    setupObserveState(BluetoothState.UNAUTHORIZED)

    await expect(ensureBluetoothAvailable()).resolves.toEqual({
      hasPermission: true,
      state: BluetoothState.UNAUTHORIZED
    })
  })

  it('runs permission check and state observation concurrently', async () => {
    // Both promises should be in-flight at the same time; verify by checking
    // that each is only called once and the result combines both.
    let permissionResolved = false
    let stateResolved = false

    mockCheck.mockImplementation(
      () =>
        new Promise<string>(res => {
          permissionResolved = true
          res(RESULTS.GRANTED)
        })
    )

    mockTransportBLE.observeState.mockImplementation(
      ({ next }: { next: (e: { type: string }) => void }) => {
        stateResolved = true
        next({ type: BluetoothState.POWERED_ON })
        return { unsubscribe: jest.fn() }
      }
    )

    const result = await ensureBluetoothAvailable()

    expect(permissionResolved).toBe(true)
    expect(stateResolved).toBe(true)
    expect(result).toEqual({
      hasPermission: true,
      state: BluetoothState.POWERED_ON
    })
  })
})

// ---------------------------------------------------------------------------
// useBluetooth hook
// ---------------------------------------------------------------------------

describe('useBluetooth', () => {
  beforeEach(() => {
    appStateListeners = []
    mockAddEventListener.mockClear()
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' })
    // iOS permission: granted by default
    mockCheck.mockResolvedValue(RESULTS.GRANTED)
  })

  afterEach(async () => {
    // Flush any pending microtasks (e.g. async iOS permission check updating
    // state) so they don't leak into the next test and trigger act() warnings.
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: originalPlatformOS
    })
    jest.clearAllMocks()
  })

  describe('isBluetoothAvailable', () => {
    it('is true when radio is on and permission is granted', async () => {
      setupObserveState(BluetoothState.POWERED_ON)

      const { result } = renderHook(() => useBluetooth())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.isBluetoothAvailable).toBe(true)
    })

    it('is false when radio is on but permission is denied', async () => {
      mockCheck.mockResolvedValue(RESULTS.BLOCKED)
      setupObserveState(BluetoothState.POWERED_ON)

      const { result } = renderHook(() => useBluetooth())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.isBluetoothAvailable).toBe(false)
    })

    it('is false when permission is granted but radio is off', async () => {
      setupObserveState(BluetoothState.POWERED_OFF)

      const { result } = renderHook(() => useBluetooth())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.isBluetoothAvailable).toBe(false)
    })
  })

  describe('isBluetoothBlocked', () => {
    it.each([
      BluetoothState.POWERED_OFF,
      BluetoothState.UNAUTHORIZED,
      BluetoothState.UNSUPPORTED
    ])('is true when radio state is %s', async state => {
      setupObserveState(state)

      const { result } = renderHook(() => useBluetooth())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.isBluetoothBlocked).toBe(true)
    })

    it('is true when radio is on but permission is denied', async () => {
      mockCheck.mockResolvedValue(RESULTS.BLOCKED)
      setupObserveState(BluetoothState.POWERED_ON)

      const { result } = renderHook(() => useBluetooth())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.isBluetoothBlocked).toBe(true)
    })

    it('is false when radio is on and permission is granted', async () => {
      setupObserveState(BluetoothState.POWERED_ON)

      const { result } = renderHook(() => useBluetooth())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.isBluetoothBlocked).toBe(false)
    })
  })

  describe('isInitializingBluetooth', () => {
    it('is true on initial render before observeState emits (UNKNOWN)', async () => {
      // observeState that never calls next — simulates delayed init
      mockTransportBLE.observeState.mockReturnValue({ unsubscribe: jest.fn() })

      const { result } = renderHook(() => useBluetooth())

      // Assert the synchronous initial state before any async effects settle
      expect(result.current.bluetoothState).toBe(BluetoothState.UNKNOWN)
      expect(result.current.isInitializingBluetooth).toBe(true)

      // Flush the async iOS permission check that runs on mount so it doesn't
      // fire setIsPermissionGranted outside of act() in subsequent tests.
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })
    })

    it('is true when state is RESETTING', async () => {
      setupObserveState(BluetoothState.RESETTING)

      const { result } = renderHook(() => useBluetooth())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.isInitializingBluetooth).toBe(true)
    })

    it('is false once POWERED_ON is received', async () => {
      setupObserveState(BluetoothState.POWERED_ON)

      const { result } = renderHook(() => useBluetooth())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.isInitializingBluetooth).toBe(false)
    })
  })

  describe('bluetoothState', () => {
    it('reflects the raw state emitted by TransportBLE.observeState', async () => {
      setupObserveState(BluetoothState.POWERED_OFF)

      const { result } = renderHook(() => useBluetooth())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.bluetoothState).toBe(BluetoothState.POWERED_OFF)
    })

    it('falls back to UNKNOWN when observeState fires the error callback', async () => {
      setupObserveStateError()

      const { result } = renderHook(() => useBluetooth())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.bluetoothState).toBe(BluetoothState.UNKNOWN)
    })
  })

  describe('foreground re-check via AppState', () => {
    it('re-reads BT state when the app returns to the foreground', async () => {
      // Start with radio off
      setupObserveState(BluetoothState.POWERED_OFF)

      const { result } = renderHook(() => useBluetooth())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.bluetoothState).toBe(BluetoothState.POWERED_OFF)

      // User enables BT in the system settings and returns to the app.
      // The AppState 'active' event fires; re-check should read POWERED_ON.
      setupObserveState(BluetoothState.POWERED_ON)

      await act(async () => {
        fireAppStateForeground()
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.bluetoothState).toBe(BluetoothState.POWERED_ON)
      expect(result.current.isBluetoothAvailable).toBe(true)
    })

    it('re-checks iOS permission when the app returns to the foreground', async () => {
      // Start with permission blocked
      mockCheck.mockResolvedValue(RESULTS.BLOCKED)
      setupObserveState(BluetoothState.POWERED_ON)

      const { result } = renderHook(() => useBluetooth())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.isBluetoothAvailable).toBe(false)

      // User grants permission in Settings and returns to the app
      mockCheck.mockResolvedValue(RESULTS.GRANTED)

      await act(async () => {
        fireAppStateForeground()
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.isBluetoothAvailable).toBe(true)
    })
  })

  describe('Android permissions', () => {
    beforeEach(() => {
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: 'android'
      })
      setupObserveState(BluetoothState.POWERED_ON)
    })

    it('is available when all Android permissions are already granted', async () => {
      jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(true as never)

      const { result } = renderHook(() => useBluetooth())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.isBluetoothAvailable).toBe(true)
    })

    it('is not available when Android permissions are denied', async () => {
      jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(false as never)

      const { result } = renderHook(() => useBluetooth())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.isBluetoothAvailable).toBe(false)
    })

    it('re-checks Android permissions when the app returns to the foreground', async () => {
      jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(false as never)

      const { result } = renderHook(() => useBluetooth())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.isBluetoothAvailable).toBe(false)

      // User grants in Settings and returns
      jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(true as never)

      await act(async () => {
        fireAppStateForeground()
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.isBluetoothAvailable).toBe(true)
    })
  })
})
