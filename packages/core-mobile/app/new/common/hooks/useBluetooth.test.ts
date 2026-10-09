import { renderHook, act } from '@testing-library/react-hooks'
import { AppState, PermissionsAndroid, Platform } from 'react-native'
import * as blePlx from 'react-native-ble-plx'
import { check, RESULTS } from 'react-native-permissions'
import { BluetoothState } from 'services/bluetooth/types'
import { useBluetooth } from './useBluetooth'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

jest.mock('react-native-ble-plx', () => {
  const onStateChange = jest.fn()
  const state = jest.fn()
  return {
    __esModule: true,
    BleManager: jest.fn(() => ({ onStateChange, state })),
    // Handles for the tests; the factory closes over one instance so every
    // `new BleManager()` shares these mocks.
    __onStateChange: onStateChange,
    __state: state,
    State: {
      PoweredOn: 'PoweredOn',
      PoweredOff: 'PoweredOff',
      Unauthorized: 'Unauthorized',
      Resetting: 'Resetting',
      Unsupported: 'Unsupported',
      Unknown: 'Unknown'
    }
  }
})

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

const { __onStateChange: mockOnStateChange, __state: mockState } =
  blePlx as unknown as { __onStateChange: jest.Mock; __state: jest.Mock }
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

/** Sets up the radio to report the given state to both read paths. */
function setupBluetoothState(state: BluetoothState): void {
  mockState.mockResolvedValue(state)
  mockOnStateChange.mockImplementation(
    (listener: (newState: string) => void) => {
      listener(state)
      return { remove: jest.fn() }
    }
  )
}

/** Sets up the radio reads to fail, as a native BLE failure would. */
function setupBluetoothStateError(): void {
  mockState.mockRejectedValue(new Error('native BLE failure'))
  mockOnStateChange.mockImplementation(() => {
    throw new Error('native BLE failure')
  })
}

const originalPlatformOS = Platform.OS

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
      setupBluetoothState(BluetoothState.POWERED_ON)

      const { result } = renderHook(() => useBluetooth())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.isBluetoothAvailable).toBe(true)
    })

    it('is false when radio is on but permission is denied', async () => {
      mockCheck.mockResolvedValue(RESULTS.BLOCKED)
      setupBluetoothState(BluetoothState.POWERED_ON)

      const { result } = renderHook(() => useBluetooth())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.isBluetoothOnAndPermissionGranted).toBe(false)
    })

    it('is false when permission is granted but radio is off', async () => {
      setupBluetoothState(BluetoothState.POWERED_OFF)

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
      setupBluetoothState(state)

      const { result } = renderHook(() => useBluetooth())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.isBluetoothBlocked).toBe(true)
    })

    it('is true when radio is on but permission is denied', async () => {
      mockCheck.mockResolvedValue(RESULTS.BLOCKED)
      setupBluetoothState(BluetoothState.POWERED_ON)

      const { result } = renderHook(() => useBluetooth())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.isBluetoothBlocked).toBe(true)
    })

    it('is false when radio is on and permission is granted', async () => {
      setupBluetoothState(BluetoothState.POWERED_ON)

      const { result } = renderHook(() => useBluetooth())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.isBluetoothBlocked).toBe(false)
    })
  })

  describe('isInitializingBluetooth', () => {
    it('is true on initial render before the radio reports (UNKNOWN)', async () => {
      // A subscription that never calls the listener — simulates delayed init
      mockOnStateChange.mockReturnValue({ remove: jest.fn() })
      mockState.mockReturnValue(new Promise(() => undefined))

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
      setupBluetoothState(BluetoothState.RESETTING)

      const { result } = renderHook(() => useBluetooth())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.isInitializingBluetooth).toBe(true)
    })

    it('is false once POWERED_ON is received', async () => {
      setupBluetoothState(BluetoothState.POWERED_ON)

      const { result } = renderHook(() => useBluetooth())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.isInitializingBluetooth).toBe(false)
    })
  })

  describe('bluetoothState', () => {
    it('reflects the raw state reported by the radio', async () => {
      setupBluetoothState(BluetoothState.POWERED_OFF)

      const { result } = renderHook(() => useBluetooth())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.bluetoothState).toBe(BluetoothState.POWERED_OFF)
    })

    it('falls back to UNKNOWN when the radio subscription throws', async () => {
      setupBluetoothStateError()

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
      setupBluetoothState(BluetoothState.POWERED_OFF)

      const { result } = renderHook(() => useBluetooth())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.bluetoothState).toBe(BluetoothState.POWERED_OFF)

      // User enables BT in the system settings and returns to the app.
      // The AppState 'active' event fires; re-check should read POWERED_ON.
      setupBluetoothState(BluetoothState.POWERED_ON)

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
      setupBluetoothState(BluetoothState.POWERED_ON)

      const { result } = renderHook(() => useBluetooth())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.isBluetoothOnAndPermissionGranted).toBe(false)

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
      setupBluetoothState(BluetoothState.POWERED_ON)
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

      expect(result.current.isBluetoothOnAndPermissionGranted).toBe(false)
    })

    it('re-checks Android permissions when the app returns to the foreground', async () => {
      jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(false as never)

      const { result } = renderHook(() => useBluetooth())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.isBluetoothOnAndPermissionGranted).toBe(false)

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
