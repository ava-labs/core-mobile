import { PermissionsAndroid, Platform } from 'react-native'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import { check, request, RESULTS } from 'react-native-permissions'
import BluetoothService from './BluetoothService'
import { BluetoothState } from './types'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

jest.mock('@ledgerhq/react-native-hw-transport-ble', () => ({
  __esModule: true,
  default: {
    observeState: jest.fn()
  }
}))

jest.mock('react-native-permissions', () => ({
  check: jest.fn(),
  request: jest.fn(),
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
const mockRequest = request as jest.Mock

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

describe('requestPermissions', () => {
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

      const result = await BluetoothService.requestPermissions()

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

      const result = await BluetoothService.requestPermissions()

      expect(result).toBe(true)
    })

    it('returns false when any permission is permanently denied (never ask again)', async () => {
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
                  ? PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
                  : PermissionsAndroid.RESULTS.GRANTED
              ])
          ) as never
        )

      const result = await BluetoothService.requestPermissions()

      expect(result).toBe(false)
    })

    it('returns true when permissions are denied (not permanently) after request', async () => {
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
              .map(p => [p, PermissionsAndroid.RESULTS.DENIED])
          ) as never
        )

      const result = await BluetoothService.requestPermissions()

      expect(result).toBe(true)
    })

    it('returns false and logs on unexpected error', async () => {
      jest
        .spyOn(PermissionsAndroid, 'check')
        .mockRejectedValue(new Error('permission check failed') as never)

      const result = await BluetoothService.requestPermissions()

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

      const result = await BluetoothService.requestPermissions()

      expect(result).toBe(false)
    })

    it('returns true when Bluetooth permission is granted', async () => {
      mockCheck.mockResolvedValue(RESULTS.GRANTED)

      const result = await BluetoothService.requestPermissions()

      expect(result).toBe(true)
    })

    it('returns true when check returns DENIED and request returns DENIED', async () => {
      mockCheck.mockResolvedValue(RESULTS.DENIED)
      mockRequest.mockResolvedValue(RESULTS.DENIED)

      const result = await BluetoothService.requestPermissions()

      expect(result).toBe(true)
    })

    it('returns true when check returns DENIED and request returns GRANTED', async () => {
      mockCheck.mockResolvedValue(RESULTS.DENIED)
      mockRequest.mockResolvedValue(RESULTS.GRANTED)

      const result = await BluetoothService.requestPermissions()

      expect(result).toBe(true)
    })

    it('returns false when check returns DENIED and request returns BLOCKED', async () => {
      mockCheck.mockResolvedValue(RESULTS.DENIED)
      mockRequest.mockResolvedValue(RESULTS.BLOCKED)

      const result = await BluetoothService.requestPermissions()

      expect(result).toBe(false)
    })

    it('returns false when check throws', async () => {
      mockCheck.mockRejectedValue(new Error('permission api unavailable'))

      const result = await BluetoothService.requestPermissions()

      expect(result).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// getBluetoothStateAsync
// ---------------------------------------------------------------------------

describe('getBluetoothState', () => {
  afterEach(() => jest.clearAllMocks())

  it.each([
    BluetoothState.POWERED_ON,
    BluetoothState.POWERED_OFF,
    BluetoothState.UNAUTHORIZED,
    BluetoothState.UNSUPPORTED
  ])('resolves with %s when observeState emits it', async state => {
    setupObserveState(state)

    await expect(BluetoothService.getBluetoothState()).resolves.toBe(state)
  })

  it('resolves with UNKNOWN when observeState fires the error callback', async () => {
    setupObserveStateError()

    await expect(BluetoothService.getBluetoothState()).resolves.toBe(
      BluetoothState.UNKNOWN
    )
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

    await expect(BluetoothService.ensureBluetoothAvailable()).resolves.toEqual({
      hasPermission: true,
      state: BluetoothState.POWERED_ON
    })
  })

  it('returns { hasPermission: false, state: POWERED_ON } when permission is blocked but radio is on', async () => {
    mockCheck.mockResolvedValue(RESULTS.BLOCKED)
    setupObserveState(BluetoothState.POWERED_ON)

    await expect(BluetoothService.ensureBluetoothAvailable()).resolves.toEqual({
      hasPermission: false,
      state: BluetoothState.POWERED_ON
    })
  })

  it('returns { hasPermission: true, state: POWERED_OFF } when permission is granted but radio is off', async () => {
    mockCheck.mockResolvedValue(RESULTS.GRANTED)
    setupObserveState(BluetoothState.POWERED_OFF)

    await expect(BluetoothService.ensureBluetoothAvailable()).resolves.toEqual({
      hasPermission: true,
      state: BluetoothState.POWERED_OFF
    })
  })

  it('returns { hasPermission: false, state: POWERED_OFF } when both permission is blocked and radio is off', async () => {
    mockCheck.mockResolvedValue(RESULTS.BLOCKED)
    setupObserveState(BluetoothState.POWERED_OFF)

    await expect(BluetoothService.ensureBluetoothAvailable()).resolves.toEqual({
      hasPermission: false,
      state: BluetoothState.POWERED_OFF
    })
  })

  it('returns { hasPermission: true, state: UNAUTHORIZED } for CoreBluetooth unauthorized state', async () => {
    mockCheck.mockResolvedValue(RESULTS.GRANTED)
    setupObserveState(BluetoothState.UNAUTHORIZED)

    await expect(BluetoothService.ensureBluetoothAvailable()).resolves.toEqual({
      hasPermission: true,
      state: BluetoothState.UNAUTHORIZED
    })
  })

  it('runs permission check and state observation concurrently', async () => {
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

    const result = await BluetoothService.ensureBluetoothAvailable()

    expect(permissionResolved).toBe(true)
    expect(stateResolved).toBe(true)
    expect(result).toEqual({
      hasPermission: true,
      state: BluetoothState.POWERED_ON
    })
  })
})
