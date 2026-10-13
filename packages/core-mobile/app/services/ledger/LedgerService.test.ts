import { jest } from '@jest/globals'
import { Alert, PermissionsAndroid, Platform } from 'react-native'
import { Observable, Subject, of } from 'rxjs'
import {
  DeviceSessionStateType,
  DeviceStatus,
  type DeviceSessionState,
  type DiscoveredDevice
} from '@ledgerhq/device-management-kit'
import { LEDGER_TIMEOUTS } from 'new/features/ledger/consts'
import Logger from 'utils/Logger'
import LedgerService from './LedgerService'
import {
  isLedgerBluetoothError,
  ledgerBluetoothErrors,
  LEDGER_SCAN_FAILED_TITLE,
  LEDGER_SCAN_FAILED_ALREADY_CONNECTED_MESSAGE
} from './LedgerBluetoothError'
import { LedgerAppType, LEDGER_ERROR_CODES } from './types'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

// BluetoothService reads the radio through ble-plx; report it powered on so
// assertBluetoothAvailable gates on the permission mocks alone.
jest.mock('react-native-ble-plx', () => ({
  __esModule: true,
  BleManager: jest.fn(() => ({
    state: jest.fn().mockResolvedValue('PoweredOn' as never),
    onStateChange: jest.fn(() => ({ remove: jest.fn() }))
  })),
  State: {
    PoweredOn: 'PoweredOn',
    PoweredOff: 'PoweredOff',
    Unauthorized: 'Unauthorized',
    Resetting: 'Resetting',
    Unsupported: 'Unsupported',
    Unknown: 'Unknown'
  },
  BleErrorCode: { DeviceConnectionFailed: 300, OperationTimedOut: 303 },
  BleIOSErrorCode: { ConnectionTimeout: 10 }
}))

jest.mock('@ledgerhq/device-transport-kit-react-native-ble', () => ({
  __esModule: true,
  RNBleTransportFactory: jest.fn(),
  rnBleTransportIdentifier: 'RN_BLE'
}))

jest.mock('@ledgerhq/device-management-kit', () => {
  const actual = jest.requireActual(
    '@ledgerhq/device-management-kit'
  ) as Record<string, unknown>

  const dmk = {
    listenToAvailableDevices: jest.fn(),
    stopDiscovering: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    getDeviceSessionState: jest.fn(),
    sendApdu: jest.fn(),
    sendCommand: jest.fn()
  }

  return {
    ...actual,
    DeviceManagementKitBuilder: jest.fn(() => ({
      addTransport: jest.fn().mockReturnThis(),
      build: jest.fn(() => dmk)
    })),
    // Handle for the tests; the factory closes over one instance so the
    // service's lazily-built kit is this object.
    __dmk: dmk
  }
})

// ---------------------------------------------------------------------------
// Typed references to mocks
// ---------------------------------------------------------------------------

const { __dmk: mockDmk } = jest.requireMock(
  '@ledgerhq/device-management-kit'
) as {
  __dmk: {
    listenToAvailableDevices: jest.Mock
    stopDiscovering: jest.Mock
    connect: jest.Mock
    disconnect: jest.Mock
    getDeviceSessionState: jest.Mock
    sendApdu: jest.Mock
    sendCommand: jest.Mock
  }
}

/**
 * The service sends OpenAppCommand / CloseAppCommand / GetAppAndVersionCommand
 * through dmk.sendCommand. Route by command name so tests can drive each.
 */
const commandHandlers: Record<string, () => unknown> = {}

const setAppInfo = (name: string, version: string): void => {
  commandHandlers.getAppAndVersion = () => ({
    status: 'SUCCESS',
    data: { name, version }
  })
}

const failAppInfo = (): void => {
  commandHandlers.getAppAndVersion = () => {
    throw new Error('No app info')
  }
}

// ---------------------------------------------------------------------------
// Shared fixtures & helpers
// ---------------------------------------------------------------------------

const DEVICE_ID = 'test-device-id'
const SESSION_ID = 'test-session-id'

const bluetoothPermissions = [
  PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
  PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
  PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
].filter(
  (
    p
  ): p is typeof PermissionsAndroid.PERMISSIONS[keyof typeof PermissionsAndroid.PERMISSIONS] =>
    Boolean(p)
)

const makePermissionResult = (
  status: typeof PermissionsAndroid.RESULTS[keyof typeof PermissionsAndroid.RESULTS]
): Record<string, string> =>
  Object.fromEntries(bluetoothPermissions.map(p => [p, status]))

const grantedPermissions = makePermissionResult(
  PermissionsAndroid.RESULTS.GRANTED
)
const deniedPermissions = makePermissionResult(
  PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
)

const discoveredDevice = (id = DEVICE_ID): DiscoveredDevice =>
  ({
    id,
    name: 'Ledger Nano X',
    deviceModel: { id: 'nanoX', model: 'nanoX' },
    transport: 'RN_BLE',
    rssi: -50
  } as unknown as DiscoveredDevice)

const readyState = (
  appName: string,
  version: string,
  deviceStatus: DeviceStatus = DeviceStatus.CONNECTED
): DeviceSessionState =>
  ({
    sessionStateType: DeviceSessionStateType.ReadyWithoutSecureChannel,
    deviceStatus,
    deviceModelId: 'nanoX',
    currentApp: { name: appName, version },
    installedApps: [],
    isSecureConnectionAllowed: false
  } as unknown as DeviceSessionState)

const originalPlatformOS = Platform.OS

/**
 * A promise the test controls. An inert handler is attached up front so
 * settling it before the service awaits it is not reported as unhandled.
 */
function deferred<T>(): {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (error: Error) => void
} {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  promise.catch(() => undefined)
  return { promise, resolve, reject }
}

/** Advances past one app-detection poll tick. */
const pollOnce = async (): Promise<void> => {
  await jest.advanceTimersByTimeAsync(
    LEDGER_TIMEOUTS.APP_POLLING_INTERVAL + 100
  )
}

/** Lets every pending promise chain settle. */
const flushMicrotasks = (): Promise<void> =>
  new Promise(resolve => setImmediate(resolve))

/** Session-state feed for the test currently running. */
let sessionState: Subject<DeviceSessionState>

function installDefaultMocks(): void {
  sessionState = new Subject<DeviceSessionState>()

  mockDmk.listenToAvailableDevices.mockReturnValue(of([discoveredDevice()]))
  mockDmk.stopDiscovering.mockResolvedValue(undefined as never)
  mockDmk.connect.mockResolvedValue(SESSION_ID as never)
  mockDmk.disconnect.mockResolvedValue(undefined as never)
  mockDmk.getDeviceSessionState.mockReturnValue(sessionState.asObservable())
  mockDmk.sendApdu.mockResolvedValue({
    statusCode: new Uint8Array([0x90, 0x00]),
    data: new Uint8Array([])
  } as never)

  for (const key of Object.keys(commandHandlers)) delete commandHandlers[key]
  commandHandlers.openApp = () => ({ status: 'SUCCESS', data: undefined })
  commandHandlers.closeApp = () => ({ status: 'SUCCESS', data: undefined })
  // Default: app info fails, so connect() caches no app type — the same
  // starting point every test that cares about app state sets up explicitly.
  failAppInfo()

  mockDmk.sendCommand.mockImplementation((args: unknown) => {
    const { command } = args as { command: { name: string } }
    const handler = commandHandlers[command.name]
    if (!handler) throw new Error(`unstubbed command: ${command.name}`)
    return Promise.resolve(handler())
  })
}

function grantAndroidPermissions(): void {
  jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(false as never)
  jest
    .spyOn(PermissionsAndroid, 'requestMultiple')
    .mockResolvedValue(grantedPermissions as never)
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: 'android'
  })
}

async function resetService(): Promise<void> {
  LedgerService.stopDeviceScanning()
  LedgerService.stopAppPolling()
  await LedgerService.disconnect().catch(() => undefined)
  LedgerService.forgetDevice()
  // LedgerService is a singleton, so its discovered-device cache would
  // otherwise let the next test skip the discovery path.
  ;['a', 'b', 'a-different-device', DEVICE_ID].forEach(id =>
    LedgerService.removeDevice(id)
  )
}

describe('LedgerService', () => {
  beforeEach(() => {
    jest.spyOn(Logger, 'info').mockImplementation(jest.fn())
    jest.spyOn(Logger, 'error').mockImplementation(jest.fn())
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn())
    installDefaultMocks()
    grantAndroidPermissions()
  })

  afterEach(async () => {
    await resetService()
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: originalPlatformOS
    })
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  // -------------------------------------------------------------------------
  describe('openApp', () => {
    beforeEach(async () => {
      jest.useFakeTimers()
      await LedgerService.connect(DEVICE_ID)
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    // openApp quits the current app and waits REQUEST_DELAY before opening the
    // next one. Under fake timers that delay never fires on its own, so start
    // the call, advance past the delay, then await.
    async function openAppWithTimers(appType: LedgerAppType): Promise<void> {
      const promise = LedgerService.openApp(appType)
      await jest.advanceTimersByTimeAsync(LEDGER_TIMEOUTS.REQUEST_DELAY)
      return promise
    }

    it('asks the device to open the requested app', async () => {
      await openAppWithTimers(LedgerAppType.AVALANCHE)

      expect(mockDmk.sendCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: SESSION_ID,
          command: expect.objectContaining({
            name: 'openApp',
            args: { appName: LedgerAppType.AVALANCHE }
          })
        })
      )
    })

    it('quits the running app before opening the next one', async () => {
      await openAppWithTimers(LedgerAppType.SOLANA)

      const names = mockDmk.sendCommand.mock.calls.map(
        c => (c[0] as { command: { name: string } }).command.name
      )
      expect(names.indexOf('closeApp')).toBeGreaterThanOrEqual(0)
      expect(names.indexOf('closeApp')).toBeLessThan(names.indexOf('openApp'))
    })

    it('does not send an open request when the app is already open', async () => {
      setAppInfo('Avalanche', '0.8.3')
      await jest.advanceTimersByTimeAsync(
        LEDGER_TIMEOUTS.APP_POLLING_INTERVAL + 100
      )
      mockDmk.sendCommand.mockClear()

      await openAppWithTimers(LedgerAppType.AVALANCHE)

      const names = mockDmk.sendCommand.mock.calls.map(
        c => (c[0] as { command: { name: string } }).command.name
      )
      expect(names).not.toContain('openApp')
      expect(names).not.toContain('closeApp')
    })

    it('does not throw when the device refuses to open the app', async () => {
      commandHandlers.openApp = () => ({
        status: 'ERROR',
        error: new Error('refused')
      })

      await expect(
        openAppWithTimers(LedgerAppType.BITCOIN)
      ).resolves.toBeUndefined()
    })

    it('does not throw when the open request fails', async () => {
      commandHandlers.openApp = () => {
        throw new Error('Device disconnected')
      }

      await expect(
        openAppWithTimers(LedgerAppType.ETHEREUM)
      ).resolves.toBeUndefined()
    })

    it('passes the app name the device expects for each app type', async () => {
      for (const appType of [
        LedgerAppType.AVALANCHE,
        LedgerAppType.SOLANA,
        LedgerAppType.BITCOIN,
        LedgerAppType.ETHEREUM
      ]) {
        mockDmk.sendCommand.mockClear()
        await openAppWithTimers(appType)
        const names = mockDmk.sendCommand.mock.calls.map(
          c =>
            (c[0] as { command: { name: string; args?: { appName?: string } } })
              .command
        )
        expect(names).toContainEqual(
          expect.objectContaining({
            name: 'openApp',
            args: { appName: appType }
          })
        )
      }
    })
  })

  // -------------------------------------------------------------------------
  // Opening or closing an app makes the device drop BLE while it reboots. The
  // kit serializes commands per session, so a command that never settles
  // wedges every later one — this is what hung onboarding at "open the
  // Avalanche app".
  describe('app switching across the BLE drop', () => {
    beforeEach(async () => {
      jest.useFakeTimers()
      await LedgerService.connect(DEVICE_ID)
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    const commandsSent = (): Array<{
      name: string
      triggersDisconnection?: boolean
    }> =>
      mockDmk.sendCommand.mock.calls.map(
        c =>
          (
            c[0] as {
              command: { name: string; triggersDisconnection?: boolean }
            }
          ).command
      )

    it('opens and closes with commands that declare triggersDisconnection', async () => {
      const promise = LedgerService.openApp(LedgerAppType.AVALANCHE)
      await jest.advanceTimersByTimeAsync(LEDGER_TIMEOUTS.REQUEST_DELAY)
      await promise

      const open = commandsSent().find(c => c.name === 'openApp')
      const close = commandsSent().find(c => c.name === 'closeApp')

      // Without this flag the kit waits for a reply the device never sends.
      expect(open?.triggersDisconnection).toBe(true)
      expect(close?.triggersDisconnection).toBe(true)
    })

    it('shares one attempt when openApp is driven twice at once', async () => {
      const both = Promise.all([
        LedgerService.openApp(LedgerAppType.AVALANCHE),
        LedgerService.openApp(LedgerAppType.AVALANCHE)
      ])
      await jest.advanceTimersByTimeAsync(LEDGER_TIMEOUTS.REQUEST_DELAY)
      await both

      // One quit -> open sequence, not two racing ones.
      const names = commandsSent().map(c => c.name)
      expect(names.filter(n => n === 'openApp')).toHaveLength(1)
      expect(names.filter(n => n === 'closeApp')).toHaveLength(1)
    })

    it('bounds every device command with an abort timeout', async () => {
      const promise = LedgerService.openApp(LedgerAppType.AVALANCHE)
      await jest.advanceTimersByTimeAsync(LEDGER_TIMEOUTS.REQUEST_DELAY)
      await promise

      for (const call of mockDmk.sendCommand.mock.calls) {
        expect((call[0] as { abortTimeout?: number }).abortTimeout).toBe(
          LEDGER_TIMEOUTS.APDU_TIMEOUT
        )
      }
    })

    it('keeps waiting while the device is unreachable mid-switch', async () => {
      // Device vanishes as it reboots into the new app.
      sessionState.next(
        readyState('BOLOS', '1.0.0', DeviceStatus.NOT_CONNECTED)
      )
      expect(LedgerService.isConnected()).toBe(false)

      const settled = jest.fn()
      const wait = LedgerService.waitForApp(LedgerAppType.AVALANCHE, 30000)
      wait.then(() => settled('resolved')).catch(() => settled('rejected'))

      // Must not give up just because the link is momentarily gone.
      await jest.advanceTimersByTimeAsync(LEDGER_TIMEOUTS.APP_CHECK_DELAY * 3)
      expect(settled).not.toHaveBeenCalled()

      // Link returns with the Avalanche app open.
      setAppInfo('Avalanche', '0.8.3')
      sessionState.next(readyState('Avalanche', '0.8.3'))
      await jest.advanceTimersByTimeAsync(LEDGER_TIMEOUTS.APP_CHECK_DELAY * 2)

      await expect(wait).resolves.toBeUndefined()
    })

    it('waits for the link to return before sending open-app after a quit', async () => {
      sessionState.next(readyState('Solana', '1.4.1'))

      // Quitting knocks the device offline; it comes back a moment later.
      commandHandlers.closeApp = () => {
        sessionState.next(
          readyState('Solana', '1.4.1', DeviceStatus.NOT_CONNECTED)
        )
        return { status: 'SUCCESS', data: undefined }
      }

      const promise = LedgerService.openApp(LedgerAppType.AVALANCHE)
      await jest.advanceTimersByTimeAsync(LEDGER_TIMEOUTS.REQUEST_DELAY)

      // Still offline — open-app must not have been attempted yet.
      expect(commandsSent().some(c => c.name === 'openApp')).toBe(false)

      sessionState.next(readyState('BOLOS', '1.0.0'))
      await jest.advanceTimersByTimeAsync(LEDGER_TIMEOUTS.APP_CHECK_DELAY * 2)
      await promise

      expect(commandsSent().some(c => c.name === 'openApp')).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // Observed on-device: the user was told the Bitcoin app (>2.4.3) was
  // unsupported and opened Bitcoin Recovery, then signing called
  // openApp(BITCOIN) — which quit Recovery and reopened the very app the user
  // had just been told not to use, failing the transaction. Recovery
  // satisfies a BITCOIN request, so openApp must leave it alone.
  describe('openApp respects app compatibility', () => {
    beforeEach(async () => {
      jest.useFakeTimers()
      await LedgerService.connect(DEVICE_ID)
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    const openWithTimers = async (app: LedgerAppType): Promise<void> => {
      const promise = LedgerService.openApp(app)
      await jest.advanceTimersByTimeAsync(LEDGER_TIMEOUTS.REQUEST_DELAY)
      await promise
    }

    const commandNames = (): string[] =>
      mockDmk.sendCommand.mock.calls.map(
        c => (c[0] as { command: { name: string } }).command.name
      )

    it('leaves Bitcoin Recovery running when the Bitcoin app is requested', async () => {
      setAppInfo('Bitcoin Recovery', '2.4.5')
      await pollOnce()
      expect(LedgerService.getCurrentAppType()).toBe(
        LedgerAppType.BITCOIN_RECOVERY
      )
      mockDmk.sendCommand.mockClear()

      await openWithTimers(LedgerAppType.BITCOIN)

      expect(commandNames()).not.toContain('closeApp')
      expect(commandNames()).not.toContain('openApp')
    })

    it('still switches away from an unrelated app', async () => {
      setAppInfo('Solana', '1.4.1')
      await pollOnce()
      mockDmk.sendCommand.mockClear()

      await openWithTimers(LedgerAppType.BITCOIN)

      expect(commandNames()).toContain('closeApp')
      expect(commandNames()).toContain('openApp')
    })

    it('does not reopen a supported Bitcoin app that is already running', async () => {
      setAppInfo('Bitcoin', '2.4.2') // at MAX_BITCOIN_APP_VERSION
      await pollOnce()
      mockDmk.sendCommand.mockClear()

      await openWithTimers(LedgerAppType.BITCOIN)

      expect(commandNames()).not.toContain('openApp')
    })

    it('does not reopen an unsupported Bitcoin app that is already running', async () => {
      setAppInfo('Bitcoin', '2.5.0') // beyond MAX_BITCOIN_APP_VERSION
      await pollOnce()
      mockDmk.sendCommand.mockClear()

      await openWithTimers(LedgerAppType.BITCOIN)

      expect(commandNames()).not.toContain('closeApp')
      expect(commandNames()).not.toContain('openApp')
    })
  })

  // -------------------------------------------------------------------------
  describe('quitLedgerApp', () => {
    beforeEach(async () => {
      // connect()'s immediate probe seeds the app type, so no polling needed.
      setAppInfo('Avalanche', '0.8.3')
      await LedgerService.connect(DEVICE_ID)
    })

    it('clears the cached app type on success', async () => {
      expect(LedgerService.getCurrentAppType()).toBe(LedgerAppType.AVALANCHE)

      await LedgerService.quitLedgerApp()

      expect(LedgerService.getCurrentAppType()).toBe(LedgerAppType.UNKNOWN)
      expect(LedgerService.getCurrentAppVersion()).toBe('')
    })

    it('keeps the cached app type when the device refuses to quit', async () => {
      commandHandlers.closeApp = () => ({
        status: 'ERROR',
        error: new Error('refused')
      })

      await LedgerService.quitLedgerApp()

      expect(LedgerService.getCurrentAppType()).toBe(LedgerAppType.AVALANCHE)
    })

    it('does not throw when the quit request fails', async () => {
      commandHandlers.closeApp = () => {
        throw new Error('No session')
      }

      await expect(LedgerService.quitLedgerApp()).resolves.toBeUndefined()
    })
  })

  // -------------------------------------------------------------------------
  describe('bluetooth permissions', () => {
    it('requests permissions when scanning for devices', async () => {
      await LedgerService.startDeviceScanning(jest.fn())

      expect(PermissionsAndroid.check).toHaveBeenCalledTimes(
        bluetoothPermissions.length
      )
      expect(PermissionsAndroid.requestMultiple).toHaveBeenCalledWith(
        bluetoothPermissions
      )
      expect(mockDmk.listenToAvailableDevices).toHaveBeenCalledTimes(1)
    })

    it('does not start scanning when permissions are denied', async () => {
      ;(PermissionsAndroid.requestMultiple as jest.Mock).mockResolvedValue(
        deniedPermissions as never
      )

      try {
        await LedgerService.startDeviceScanning(jest.fn())
        throw new Error('Expected startDeviceScanning to fail')
      } catch (error) {
        expect(
          isLedgerBluetoothError(error) &&
            error.code === LEDGER_ERROR_CODES.BLUETOOTH_PERMISSION
        ).toBe(true)
      }

      expect(mockDmk.listenToAvailableDevices).not.toHaveBeenCalled()
      expect(Alert.alert).not.toHaveBeenCalled()
    })

    it('requests permissions when establishing a connection', async () => {
      await LedgerService.connect(DEVICE_ID)

      expect(PermissionsAndroid.check).toHaveBeenCalledTimes(
        bluetoothPermissions.length
      )
      expect(PermissionsAndroid.requestMultiple).toHaveBeenCalledWith(
        bluetoothPermissions
      )
      expect(mockDmk.connect).toHaveBeenCalledWith({
        device: discoveredDevice()
      })
    })

    it('does not reopen permission prompts when permissions are already granted', async () => {
      ;(PermissionsAndroid.check as jest.Mock).mockResolvedValue(true as never)

      await LedgerService.connect(DEVICE_ID)

      expect(PermissionsAndroid.requestMultiple).not.toHaveBeenCalled()
      expect(mockDmk.connect).toHaveBeenCalledTimes(1)
    })

    it('fails connection before opening a session when permissions are denied', async () => {
      ;(PermissionsAndroid.requestMultiple as jest.Mock).mockResolvedValue(
        deniedPermissions as never
      )

      try {
        await LedgerService.connect(DEVICE_ID)
        throw new Error('Expected connect to fail')
      } catch (error) {
        expect((error as Error).message).toBe(
          'Bluetooth permissions are required to connect to Ledger devices.'
        )
        expect(
          isLedgerBluetoothError(error) &&
            error.code === LEDGER_ERROR_CODES.BLUETOOTH_PERMISSION
        ).toBe(true)
      }

      expect(mockDmk.connect).not.toHaveBeenCalled()
      expect(Alert.alert).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  describe('connect', () => {
    it('resolves the device id against discovery before connecting', async () => {
      await LedgerService.connect(DEVICE_ID)

      expect(mockDmk.listenToAvailableDevices).toHaveBeenCalledWith({
        transport: 'RN_BLE'
      })
      expect(mockDmk.connect).toHaveBeenCalledWith({
        device: discoveredDevice()
      })
      expect(LedgerService.isConnected()).toBe(true)
    })

    it('reuses a device already seen during a user-initiated scan', async () => {
      await LedgerService.startDeviceScanning(jest.fn())
      mockDmk.listenToAvailableDevices.mockClear()

      await LedgerService.connect(DEVICE_ID)

      expect(mockDmk.listenToAvailableDevices).not.toHaveBeenCalled()
      expect(mockDmk.connect).toHaveBeenCalledTimes(1)
    })

    it('stops the discovery it started once the device is resolved', async () => {
      await LedgerService.connect(DEVICE_ID)

      expect(mockDmk.stopDiscovering).toHaveBeenCalledTimes(1)
    })

    it('leaves a user-initiated scan running', async () => {
      await LedgerService.startDeviceScanning(jest.fn())
      // Force the discovery path even though a scan is active.
      LedgerService.removeDevice(DEVICE_ID)
      mockDmk.stopDiscovering.mockClear()

      await LedgerService.connect(DEVICE_ID)

      expect(mockDmk.stopDiscovering).not.toHaveBeenCalled()
    })

    it('does not retry on a generic non-retryable error', async () => {
      mockDmk.connect.mockRejectedValueOnce(
        new Error('Unexpected transport error') as never
      )

      await expect(LedgerService.connect(DEVICE_ID)).rejects.toThrow(
        'Failed to connect to Ledger: Unexpected transport error'
      )
      expect(mockDmk.connect).toHaveBeenCalledTimes(1)
    })

    it('caches the app type from the immediate app-info probe', async () => {
      setAppInfo('Avalanche', '0.8.3')

      await LedgerService.connect(DEVICE_ID)

      expect(LedgerService.getCurrentAppType()).toBe(LedgerAppType.AVALANCHE)
      expect(LedgerService.getCurrentAppVersion()).toBe('0.8.3')
    })
  })

  // -------------------------------------------------------------------------
  // Observed on-device: the app-info probe issued right after connect never
  // settled (the kit's own abortTimeout did not fire), so connect() hung and
  // every retry joined the stuck promise — "connect() already in flight".
  describe('a command that never settles', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    it('does not let a hung app-info probe hang connect()', async () => {
      commandHandlers.getAppAndVersion = () => new Promise(() => undefined)

      const connected = jest.fn()
      const promise = LedgerService.connect(DEVICE_ID).then(connected)

      await jest.advanceTimersByTimeAsync(1000)
      expect(connected).not.toHaveBeenCalled()

      // The probe is best-effort, so connect completes once it gives up.
      await jest.advanceTimersByTimeAsync(LEDGER_TIMEOUTS.APDU_TIMEOUT + 100)
      await promise

      expect(connected).toHaveBeenCalled()
      expect(LedgerService.isConnected()).toBe(true)
    })

    it('clears the in-flight mutex so a later connect is not trapped', async () => {
      // A connect that never finishes at all.
      mockDmk.connect.mockReturnValue(new Promise(() => undefined) as never)

      const first = LedgerService.connect(DEVICE_ID)
      const firstRejects = expect(first).rejects.toThrow(/timed out/)
      await jest.advanceTimersByTimeAsync(
        LEDGER_TIMEOUTS.CONNECTION_TIMEOUT + 100
      )
      await firstRejects

      // The mutex must be free again rather than handing back the dead promise.
      mockDmk.connect.mockResolvedValue(SESSION_ID as never)
      await expect(LedgerService.connect(DEVICE_ID)).resolves.toBeUndefined()
    })
  })

  // -------------------------------------------------------------------------
  // Observed on-device: the session never advanced past "Connected", so it
  // never reported currentApp. App detection has to work anyway.
  describe('app detection without a Ready session', () => {
    it('reads the running app by polling the device directly', async () => {
      jest.useFakeTimers()
      await LedgerService.connect(DEVICE_ID)

      // Session stays Connected — no currentApp ever arrives.
      sessionState.next({
        sessionStateType: DeviceSessionStateType.Connected,
        deviceStatus: DeviceStatus.CONNECTED,
        deviceModelId: 'nanoX'
      } as never)
      expect(LedgerService.getCurrentAppType()).toBe(LedgerAppType.UNKNOWN)

      setAppInfo('Avalanche', '0.8.3')
      await jest.advanceTimersByTimeAsync(
        LEDGER_TIMEOUTS.APP_POLLING_INTERVAL + 100
      )

      expect(LedgerService.getCurrentAppType()).toBe(LedgerAppType.AVALANCHE)
      expect(LedgerService.getCurrentAppVersion()).toBe('0.8.3')
      jest.useRealTimers()
    })
  })

  // -------------------------------------------------------------------------
  // Observed on-device: the first connect succeeded and the session reached
  // Ready with the Avalanche app, then a second connect() for the same device
  // arrived ~0.5s later, tore the working session down, and the device dropped
  // for good.
  describe('a repeat connect for the device already attached', () => {
    it('is a no-op rather than tearing down the live session', async () => {
      await LedgerService.connect(DEVICE_ID)
      expect(LedgerService.isConnected()).toBe(true)

      mockDmk.connect.mockClear()
      mockDmk.disconnect.mockClear()

      await LedgerService.connect(DEVICE_ID)

      expect(mockDmk.disconnect).not.toHaveBeenCalled()
      expect(mockDmk.connect).not.toHaveBeenCalled()
      expect(LedgerService.isConnected()).toBe(true)
    })

    it('still reconnects once the device has actually dropped', async () => {
      await LedgerService.connect(DEVICE_ID)
      sessionState.next(
        readyState('Avalanche', '0.8.3', DeviceStatus.NOT_CONNECTED)
      )
      expect(LedgerService.isConnected()).toBe(false)

      mockDmk.connect.mockClear()
      await LedgerService.connect(DEVICE_ID)

      expect(mockDmk.connect).toHaveBeenCalledTimes(1)
    })

    it('still switches when a different device is requested', async () => {
      await LedgerService.connect(DEVICE_ID)
      mockDmk.connect.mockClear()

      mockDmk.listenToAvailableDevices.mockReturnValue(
        of([discoveredDevice('other-device')])
      )
      await LedgerService.connect('other-device')

      expect(mockDmk.disconnect).toHaveBeenCalled()
      expect(mockDmk.connect).toHaveBeenCalledTimes(1)
    })
  })

  // -------------------------------------------------------------------------
  describe('connectInFlight', () => {
    it('concurrent connect() calls share the same in-flight promise', async () => {
      const gate = deferred<string>()
      mockDmk.connect.mockReturnValue(gate.promise as never)

      const first = LedgerService.connect(DEVICE_ID)
      const second = LedgerService.connect(DEVICE_ID)

      gate.resolve(SESSION_ID)
      await Promise.all([first, second])

      expect(mockDmk.connect).toHaveBeenCalledTimes(1)
    })

    it('concurrent callers all reject when the in-flight connect fails', async () => {
      mockDmk.connect.mockRejectedValue(new Error('boom') as never)

      const first = LedgerService.connect(DEVICE_ID)
      const second = LedgerService.connect(DEVICE_ID)

      await Promise.all([
        expect(first).rejects.toThrow(/Failed to connect to Ledger/),
        expect(second).rejects.toThrow(/Failed to connect to Ledger/)
      ])

      expect(mockDmk.connect).toHaveBeenCalledTimes(1)
    })

    it('allows a fresh connect() after a failed in-flight attempt resolves', async () => {
      mockDmk.connect.mockRejectedValueOnce(new Error('boom') as never)

      await expect(LedgerService.connect(DEVICE_ID)).rejects.toThrow()
      await expect(LedgerService.connect(DEVICE_ID)).resolves.toBeUndefined()

      expect(mockDmk.connect).toHaveBeenCalledTimes(2)
    })

    it('rejects when a different device tries to connect while one is in-flight', async () => {
      const gate = deferred<string>()
      mockDmk.connect.mockReturnValue(gate.promise as never)

      const first = LedgerService.connect(DEVICE_ID)
      const second = LedgerService.connect('a-different-device')

      await expect(second).rejects.toThrow(
        `Connection to ${DEVICE_ID} already in progress`
      )

      gate.resolve(SESSION_ID)
      await first
    })
  })

  // -------------------------------------------------------------------------
  // Observed on-device: the kit's session refresher reported currentApp
  // "BOLOS" while the Avalanche app was open, and a direct GetAppAndVersion
  // reported "Avalanche". With both writing currentAppType, the refresher
  // (~1s) and the poll (2s) overwrote each other and the app type flapped
  // Unknown <-> Avalanche, logging on every tick. The poll is the only writer.
  describe('app detection has a single source', () => {
    beforeEach(async () => {
      jest.useFakeTimers()
      await LedgerService.connect(DEVICE_ID)
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    it('takes the running app from the poll', async () => {
      setAppInfo('Avalanche', '0.8.3')
      await pollOnce()

      expect(LedgerService.getCurrentAppType()).toBe(LedgerAppType.AVALANCHE)
      expect(LedgerService.getCurrentAppVersion()).toBe('0.8.3')

      setAppInfo('Solana', '1.4.1')
      await pollOnce()

      expect(LedgerService.getCurrentAppType()).toBe(LedgerAppType.SOLANA)
      expect(LedgerService.getCurrentAppVersion()).toBe('1.4.1')
    })

    it('ignores the app the session refresher reports', async () => {
      setAppInfo('Avalanche', '0.8.3')
      await pollOnce()
      expect(LedgerService.getCurrentAppType()).toBe(LedgerAppType.AVALANCHE)

      // The refresher insists the device is on the dashboard. It must not
      // overwrite what the poll established.
      sessionState.next(readyState('BOLOS', '1.0.0'))
      sessionState.next(readyState('BOLOS', '1.0.0', DeviceStatus.BUSY))

      expect(LedgerService.getCurrentAppType()).toBe(LedgerAppType.AVALANCHE)
      expect(LedgerService.getCurrentAppVersion()).toBe('0.8.3')
    })

    it('maps BOLOS to UNKNOWN without logging it as unrecognised', async () => {
      const info = jest.spyOn(Logger, 'info')
      setAppInfo('BOLOS', '1.0.0')
      await pollOnce()

      expect(LedgerService.getCurrentAppType()).toBe(LedgerAppType.UNKNOWN)
      expect(info).not.toHaveBeenCalledWith(
        expect.stringContaining('Unknown app name detected')
      )
    })

    it('still logs a genuinely unrecognised app name', async () => {
      const info = jest.spyOn(Logger, 'info')
      setAppInfo('Dogecoin', '1.0.0')
      await pollOnce()

      expect(LedgerService.getCurrentAppType()).toBe(LedgerAppType.UNKNOWN)
      expect(info).toHaveBeenCalledWith(
        expect.stringContaining('Unknown app name detected')
      )
    })

    it('stops polling once stopAppPolling is called', async () => {
      LedgerService.stopAppPolling()

      setAppInfo('Avalanche', '0.8.3')
      await pollOnce()

      expect(LedgerService.getCurrentAppType()).toBe(LedgerAppType.UNKNOWN)
    })
  })

  // -------------------------------------------------------------------------
  describe('connection state', () => {
    it('reports unreachable when the device status drops, keeping the session', async () => {
      const listener = jest.fn()
      const unsubscribe = LedgerService.addConnectionStateListener(listener)

      await LedgerService.connect(DEVICE_ID)
      expect(listener).toHaveBeenCalledWith(true)
      listener.mockClear()

      sessionState.next(
        readyState('Avalanche', '0.8.3', DeviceStatus.NOT_CONNECTED)
      )

      expect(listener).toHaveBeenCalledWith(false)
      expect(LedgerService.isConnected()).toBe(false)
      // The BLE transport retries the link itself, so the session is kept.
      expect(mockDmk.disconnect).not.toHaveBeenCalled()

      unsubscribe()
    })

    it('keeps tracking reachability after stopAppPolling', async () => {
      await LedgerService.connect(DEVICE_ID)
      LedgerService.stopAppPolling()

      sessionState.next(
        readyState('Avalanche', '0.8.3', DeviceStatus.NOT_CONNECTED)
      )

      expect(LedgerService.isConnected()).toBe(false)
    })

    it('reports reachable again when the transport restores the link', async () => {
      const listener = jest.fn()
      const unsubscribe = LedgerService.addConnectionStateListener(listener)

      await LedgerService.connect(DEVICE_ID)
      sessionState.next(
        readyState('Avalanche', '0.8.3', DeviceStatus.NOT_CONNECTED)
      )
      listener.mockClear()

      sessionState.next(readyState('Avalanche', '0.8.3'))

      expect(listener).toHaveBeenCalledWith(true)
      expect(LedgerService.isConnected()).toBe(true)

      unsubscribe()
    })

    it('does not re-notify when the status changes without changing reachability', async () => {
      await LedgerService.connect(DEVICE_ID)

      const listener = jest.fn()
      const unsubscribe = LedgerService.addConnectionStateListener(listener)

      sessionState.next(readyState('Avalanche', '0.8.3', DeviceStatus.BUSY))
      sessionState.next(readyState('Avalanche', '0.8.3', DeviceStatus.LOCKED))

      expect(listener).not.toHaveBeenCalled()

      unsubscribe()
    })

    it('tears the session down on an explicit disconnect', async () => {
      await LedgerService.connect(DEVICE_ID)

      await LedgerService.disconnect()

      expect(mockDmk.disconnect).toHaveBeenCalledWith({
        sessionId: SESSION_ID
      })
      expect(LedgerService.isConnected()).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  describe('scheduleReconnect', () => {
    it('reconnects to the remembered device after a lifecycle disconnect', async () => {
      await LedgerService.connect(DEVICE_ID)
      await LedgerService.disconnect({ manual: false })
      mockDmk.connect.mockClear()

      LedgerService.scheduleReconnect('app-foreground')
      await flushMicrotasks()

      expect(mockDmk.connect).toHaveBeenCalledTimes(1)
    })

    it('does not reconnect after a manual disconnect', async () => {
      await LedgerService.connect(DEVICE_ID)
      await LedgerService.disconnect({ manual: true })
      mockDmk.connect.mockClear()

      LedgerService.scheduleReconnect('app-foreground')
      await flushMicrotasks()

      expect(mockDmk.connect).not.toHaveBeenCalled()
    })

    it('does not reconnect once the device has been forgotten', async () => {
      await LedgerService.connect(DEVICE_ID)
      await LedgerService.disconnect({ manual: false })
      LedgerService.forgetDevice()
      mockDmk.connect.mockClear()

      LedgerService.scheduleReconnect('app-foreground')
      await flushMicrotasks()

      expect(mockDmk.connect).not.toHaveBeenCalled()
    })

    it('does nothing while the device is still reachable', async () => {
      await LedgerService.connect(DEVICE_ID)
      mockDmk.connect.mockClear()

      LedgerService.scheduleReconnect('app-foreground')
      await flushMicrotasks()

      expect(mockDmk.connect).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  describe('ensureConnection', () => {
    it('returns the live session without reconnecting', async () => {
      await LedgerService.connect(DEVICE_ID)
      mockDmk.connect.mockClear()

      await expect(LedgerService.ensureConnection()).resolves.toEqual({
        dmk: mockDmk,
        sessionId: SESSION_ID
      })
      expect(mockDmk.connect).not.toHaveBeenCalled()
    })

    it('reconnects when the session went away between signing steps', async () => {
      await LedgerService.connect(DEVICE_ID)
      await LedgerService.disconnect({ manual: false })
      mockDmk.connect.mockClear()

      await expect(LedgerService.ensureConnection()).resolves.toEqual({
        dmk: mockDmk,
        sessionId: SESSION_ID
      })
      expect(mockDmk.connect).toHaveBeenCalledTimes(1)
    })

    it('waits for a recovering session instead of replacing it', async () => {
      jest.useFakeTimers()
      try {
        await LedgerService.connect(DEVICE_ID)
        sessionState.next(
          readyState('Avalanche', '0.8.3', DeviceStatus.NOT_CONNECTED)
        )
        mockDmk.connect.mockClear()

        const pending = LedgerService.ensureConnection()
        await jest.advanceTimersByTimeAsync(LEDGER_TIMEOUTS.APP_CHECK_DELAY)
        sessionState.next(readyState('Avalanche', '0.8.3'))
        await jest.advanceTimersByTimeAsync(LEDGER_TIMEOUTS.APP_CHECK_DELAY)

        await expect(pending).resolves.toEqual({
          dmk: mockDmk,
          sessionId: SESSION_ID
        })
        expect(mockDmk.connect).not.toHaveBeenCalled()
        expect(mockDmk.disconnect).not.toHaveBeenCalled()
      } finally {
        jest.useRealTimers()
      }
    })

    it('reconnects when a dropped session never recovers', async () => {
      jest.useFakeTimers()
      try {
        await LedgerService.connect(DEVICE_ID)
        sessionState.next(
          readyState('Avalanche', '0.8.3', DeviceStatus.NOT_CONNECTED)
        )
        mockDmk.connect.mockClear()

        const pending = LedgerService.ensureConnection()
        await jest.advanceTimersByTimeAsync(
          LEDGER_TIMEOUTS.RECONNECT_WAIT + LEDGER_TIMEOUTS.APP_CHECK_DELAY
        )

        await expect(pending).resolves.toEqual({
          dmk: mockDmk,
          sessionId: SESSION_ID
        })
        expect(mockDmk.connect).toHaveBeenCalledTimes(1)
      } finally {
        jest.useRealTimers()
      }
    })

    it('throws when no device is remembered', async () => {
      await expect(LedgerService.ensureConnection()).rejects.toThrow(
        LEDGER_ERROR_CODES.TRANSPORT_INTERFACE_NOT_AVAILABLE
      )
    })
  })

  // -------------------------------------------------------------------------
  describe('waitForApp', () => {
    it('reports a locked device straight away instead of polling to the timeout', async () => {
      await LedgerService.connect(DEVICE_ID)
      commandHandlers.getAppAndVersion = () => ({
        status: 'ERROR',
        error: {
          _tag: 'GlobalCommandError',
          errorCode: '5515',
          message: 'Device is locked.'
        }
      })

      await expect(
        LedgerService.waitForApp(LedgerAppType.AVALANCHE, 5000)
      ).rejects.toThrow('Your Ledger device is locked')
    })

    it('should reject immediately when signal is already aborted', async () => {
      const controller = new AbortController()
      controller.abort()

      await expect(
        LedgerService.waitForApp(LedgerAppType.SOLANA, 5000, controller.signal)
      ).rejects.toThrow(LEDGER_ERROR_CODES.USER_CANCELLED)
    })

    it('should reject when signal is aborted during polling', async () => {
      jest.useFakeTimers()
      await LedgerService.connect(DEVICE_ID)

      // Make checkApp always return false (app never opens)
      const checkAppSpy = jest
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .spyOn(LedgerService as any, 'checkApp')
        .mockResolvedValue(false as never)

      const controller = new AbortController()

      const waitPromise = LedgerService.waitForApp(
        LedgerAppType.SOLANA,
        30000,
        controller.signal
      )

      // Let the immediate checkApp resolve and the interval start
      await jest.advanceTimersByTimeAsync(100)

      // Abort after polling has started, then immediately attach the
      // rejection handler so Jest doesn't see an unhandled rejection.
      controller.abort()
      // eslint-disable-next-line jest/valid-expect
      const rejectPromise = expect(waitPromise).rejects.toThrow(
        LEDGER_ERROR_CODES.USER_CANCELLED
      )

      // Advance past the next polling tick so any remaining cleanup runs
      await jest.advanceTimersByTimeAsync(LEDGER_TIMEOUTS.APP_CHECK_DELAY + 100)

      await rejectPromise

      checkAppSpy.mockRestore()
      jest.useRealTimers()
    })

    it('returns as soon as the requested app is detected', async () => {
      setAppInfo('Solana', '1.4.1')
      await LedgerService.connect(DEVICE_ID)

      await expect(
        LedgerService.waitForApp(LedgerAppType.SOLANA, 5000)
      ).resolves.toBeUndefined()
    })
  })

  // -------------------------------------------------------------------------
  describe('device scanning', () => {
    it('publishes the device list the kit reports', async () => {
      const deviceListener = jest.fn()
      LedgerService.addDeviceListener(deviceListener)
      deviceListener.mockClear()

      await LedgerService.startDeviceScanning(jest.fn())

      expect(deviceListener).toHaveBeenCalledWith([
        { id: DEVICE_ID, name: 'Ledger Nano X', rssi: -50 }
      ])
      expect(LedgerService.getIsScanning()).toBe(true)

      LedgerService.removeDeviceListener(deviceListener)
    })

    it('replaces the list on each emission rather than accumulating', async () => {
      const feed = new Subject<DiscoveredDevice[]>()
      mockDmk.listenToAvailableDevices.mockReturnValue(feed.asObservable())

      await LedgerService.startDeviceScanning(jest.fn())

      feed.next([discoveredDevice('a'), discoveredDevice('b')])
      expect(LedgerService.getCurrentDevices()).toHaveLength(2)

      feed.next([discoveredDevice('a')])
      expect(LedgerService.getCurrentDevices()).toEqual([
        { id: 'a', name: 'Ledger Nano X', rssi: -50 }
      ])
    })

    it('does not start a second scan while one is in progress', async () => {
      await LedgerService.startDeviceScanning(jest.fn())
      await LedgerService.startDeviceScanning(jest.fn())

      expect(mockDmk.listenToAvailableDevices).toHaveBeenCalledTimes(1)
    })

    it('stops kit discovery when scanning stops', async () => {
      await LedgerService.startDeviceScanning(jest.fn())
      mockDmk.stopDiscovering.mockClear()

      LedgerService.stopDeviceScanning()

      expect(LedgerService.getIsScanning()).toBe(false)
      expect(mockDmk.stopDiscovering).toHaveBeenCalledTimes(1)
    })
  })

  // -------------------------------------------------------------------------
  describe('scan errors', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    it('calls onScanError (not Alert.alert) when discovery fires a non-BLE error', async () => {
      const onScanError = jest.fn()
      const scanError = new Error('Hardware failure')
      mockDmk.listenToAvailableDevices.mockReturnValue(
        new Observable(subscriber => subscriber.error(scanError))
      )

      await LedgerService.startDeviceScanning(onScanError)

      expect(onScanError).toHaveBeenCalledTimes(1)
      expect(onScanError).toHaveBeenCalledWith({
        title: 'Scan Error',
        message: `Failed to scan for devices: ${scanError.message}`
      })
      expect(Alert.alert).not.toHaveBeenCalled()
    })

    it('calls showBluetoothErrorAlert (not onScanError) when discovery fires a BLE error', async () => {
      const onScanError = jest.fn()
      const bleError = ledgerBluetoothErrors.radioOff()
      mockDmk.listenToAvailableDevices.mockReturnValue(
        new Observable(subscriber => subscriber.error(bleError))
      )

      await LedgerService.startDeviceScanning(onScanError)

      expect(onScanError).not.toHaveBeenCalled()
      expect(Alert.alert).toHaveBeenCalledTimes(1)
    })

    it('calls onScanError with LEDGER_SCAN_FAILED title when scan times out with no devices', async () => {
      const onScanError = jest.fn()
      mockDmk.listenToAvailableDevices.mockReturnValue(
        new Subject<DiscoveredDevice[]>().asObservable()
      )

      await LedgerService.startDeviceScanning(onScanError)

      jest.advanceTimersByTime(LEDGER_TIMEOUTS.SCAN_TIMEOUT + 100)

      expect(onScanError).toHaveBeenCalledTimes(1)
      expect(onScanError).toHaveBeenCalledWith({
        title: LEDGER_SCAN_FAILED_TITLE,
        message: LEDGER_SCAN_FAILED_ALREADY_CONNECTED_MESSAGE
      })
    })

    it('does not call onScanError when scan times out after devices were found', async () => {
      const onScanError = jest.fn()

      await LedgerService.startDeviceScanning(onScanError)

      jest.advanceTimersByTime(LEDGER_TIMEOUTS.SCAN_TIMEOUT + 100)

      expect(onScanError).not.toHaveBeenCalled()
    })

    it('calls onScanError when discovery throws synchronously', async () => {
      const onScanError = jest.fn()
      const syncError = new Error('Discovery threw synchronously')
      mockDmk.listenToAvailableDevices.mockImplementation(() => {
        throw syncError
      })

      await LedgerService.startDeviceScanning(onScanError)

      expect(onScanError).toHaveBeenCalledTimes(1)
      expect(onScanError).toHaveBeenCalledWith({
        title: 'Scan Error',
        message: `Failed to scan for devices: ${syncError.message}`
      })
    })
  })

  // -------------------------------------------------------------------------
  describe('getSolanaKeysForRange', () => {
    it('should stop iterating when signal is aborted', async () => {
      const controller = new AbortController()

      // Mock getSolanaKeys to abort the controller on the second call,
      // simulating the user tapping "Skip" while keys are being retrieved.
      const getSolanaKeysSpy = jest
        .spyOn(LedgerService, 'getSolanaKeys')
        .mockImplementation(async (index: number, _signal?: AbortSignal) => {
          if (index === 1) {
            controller.abort()
          }
          // Check signal after potential abort
          if (controller.signal.aborted) {
            throw new Error(LEDGER_ERROR_CODES.USER_CANCELLED)
          }
          return [
            {
              key: `solana-key-${index}`,
              derivationPath: `m/44'/501'/${index}'/0'`,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              curve: 'ed25519' as any
            }
          ]
        })

      // Request 5 keys starting at index 0
      const results = await LedgerService.getSolanaKeysForRange(
        5,
        0,
        controller.signal
      )

      // Should have stopped after index 1 aborted — only index 0 succeeded
      expect(results).toHaveLength(1)
      expect(results[0]?.[0]?.key).toBe('solana-key-0')

      // getSolanaKeys should not have been called for indices 2, 3, 4
      expect(getSolanaKeysSpy).toHaveBeenCalledTimes(2)

      getSolanaKeysSpy.mockRestore()
    })
  })
})
