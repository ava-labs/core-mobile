import { jest } from '@jest/globals'
import { Alert, PermissionsAndroid, Platform } from 'react-native'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
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

jest.mock('@ledgerhq/react-native-hw-transport-ble', () => ({
  __esModule: true,
  default: {
    open: jest.fn(),
    listen: jest.fn(),
    disconnectDevice: jest.fn(),
    observeState: jest.fn(
      ({ next }: { next: (e: { type: string }) => void }) => {
        next({ type: 'PoweredOn' })
        return { unsubscribe: jest.fn() }
      }
    )
  }
}))

describe('LedgerService', () => {
  describe('openApp', () => {
    const transportBLEMock = TransportBLE as unknown as {
      open: jest.Mock
      disconnectDevice: jest.Mock
    }

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

    const grantedPermissions = Object.fromEntries(
      bluetoothPermissions.map(p => [p, PermissionsAndroid.RESULTS.GRANTED])
    )

    const DEVICE_ID = 'test-device-id'
    const originalPlatformOS = Platform.OS

    let mockTransport: {
      id: string
      exchange: jest.Mock
      isConnected: boolean
      close: jest.Mock
      on: jest.Mock
      off: jest.Mock
      exchangeBusyPromise: null
    }

    beforeEach(async () => {
      jest.useFakeTimers()
      jest.spyOn(Logger, 'info').mockImplementation(jest.fn())
      jest.spyOn(Logger, 'error').mockImplementation(jest.fn())
      jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(false as never)
      jest
        .spyOn(PermissionsAndroid, 'requestMultiple')
        .mockResolvedValue(grantedPermissions as never)
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: 'android'
      })

      mockTransport = {
        id: DEVICE_ID,
        exchange: jest.fn(),
        isConnected: true,
        close: jest.fn().mockResolvedValue(undefined as never),
        on: jest.fn(),
        off: jest.fn(),
        exchangeBusyPromise: null
      }

      transportBLEMock.disconnectDevice.mockResolvedValue(undefined as never)
      // Default: exchange rejects so getCurrentAppInfo (called during
      // connect) doesn't set a cached app type.
      mockTransport.exchange.mockRejectedValue(
        new Error('No app info') as never
      )
      transportBLEMock.open.mockResolvedValue(mockTransport as never)

      // Establish a real connection so withTransport works.
      // connect() calls wrapTransportExchange which replaces the exchange
      // method, so we restore a fresh mock afterwards for test assertions.
      await LedgerService.connect(DEVICE_ID)
      LedgerService.stopAppPolling()
      mockTransport.exchange = jest.fn()
    })

    afterEach(async () => {
      await LedgerService.disconnect().catch(() => undefined)
      LedgerService.forgetDevice()
      LedgerService.stopAppPolling()
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: originalPlatformOS
      })
      jest.restoreAllMocks()
    })

    // openApp now calls quitLedgerApp() + REQUEST_DELAY before sending
    // the open APDU. Under fake timers the delay never fires, so we
    // start the call, advance timers past the delay, then await.
    async function openAppWithTimers(appType: LedgerAppType): Promise<void> {
      const promise = LedgerService.openApp(appType)
      await jest.advanceTimersByTimeAsync(LEDGER_TIMEOUTS.REQUEST_DELAY)
      return promise
    }

    it('should successfully open the app when device returns success status code', async () => {
      const appType = LedgerAppType.AVALANCHE

      // Mock successful response: data + status word (0x9000)
      const successResponse = Buffer.from([0x90, 0x00])
      mockTransport.exchange.mockResolvedValue(successResponse as never)

      await openAppWithTimers(appType)

      // Verify APDU was sent (quit + open = 2 exchange calls)
      // The last call is the open-app APDU
      const openCall =
        mockTransport.exchange.mock.calls[
          mockTransport.exchange.mock.calls.length - 1
        ]
      // @ts-ignore
      const apdu = openCall[0] as Buffer
      expect(apdu[0]).toBe(0xe0) // CLA
      expect(apdu[1]).toBe(0xd8) // INS
      expect(apdu[2]).toBe(0x00) // P1
      expect(apdu[3]).toBe(0x00) // P2
      expect(apdu[4]).toBe(appType.length) // Lc (length)

      // Verify app name in APDU
      const appNameBytes = apdu.slice(5)
      expect(appNameBytes.toString('ascii')).toBe(appType)

      // Verify success was logged
      expect(Logger.info).toHaveBeenCalledWith(
        `Successfully opened ${appType} app on Ledger device using APDU`
      )
    })

    it('should log info when device returns non-success status code', async () => {
      const appType = LedgerAppType.SOLANA

      // Mock response with error status code (0x6985 = USER_REJECTED)
      const errorResponse = Buffer.from([0x69, 0x85])
      mockTransport.exchange.mockResolvedValue(errorResponse as never)

      await openAppWithTimers(appType)

      // Verify non-success status was logged
      expect(Logger.info).toHaveBeenCalledWith('Unexpected status word: 0x6985')
    })

    it('should handle APP_NOT_OPEN error code gracefully', async () => {
      const appType = LedgerAppType.ETHEREUM

      // Mock response with APP_NOT_OPEN status code (0x6a80)
      const errorResponse = Buffer.from([0x6a, 0x80]) as never
      mockTransport.exchange.mockResolvedValue(errorResponse)

      await openAppWithTimers(appType)

      expect(Logger.info).toHaveBeenCalledWith('Unexpected status word: 0x6a80')
    })

    it('should handle DEVICE_LOCKED error code gracefully', async () => {
      const appType = LedgerAppType.BITCOIN

      // Mock response with DEVICE_LOCKED status code (0x5515)
      const errorResponse = Buffer.from([0x55, 0x15]) as never
      mockTransport.exchange.mockResolvedValue(errorResponse)

      await openAppWithTimers(appType)

      expect(Logger.info).toHaveBeenCalledWith('Unexpected status word: 0x5515')
    })

    it('should not throw error when exchange fails', async () => {
      const appType = LedgerAppType.AVALANCHE
      const exchangeError = new Error('Transport exchange failed')

      mockTransport.exchange.mockRejectedValue(exchangeError as never)

      // Should not throw
      await openAppWithTimers(appType)

      // Verify error was logged as info (best-effort)
      expect(Logger.info).toHaveBeenCalledWith(
        `Failed to open ${appType} app:`,
        exchangeError
      )
    })

    it('should handle transport disconnection error gracefully', async () => {
      const appType = LedgerAppType.SOLANA
      const disconnectError = new Error('Transport not connected') as never

      mockTransport.exchange.mockRejectedValue(disconnectError)

      await openAppWithTimers(appType)

      expect(Logger.info).toHaveBeenCalledWith(
        `Failed to open ${appType} app:`,
        disconnectError
      )
    })

    it('should build correct APDU for different app types', async () => {
      const testCases = [
        LedgerAppType.AVALANCHE,
        LedgerAppType.SOLANA,
        LedgerAppType.ETHEREUM,
        LedgerAppType.BITCOIN
      ]

      for (const appType of testCases) {
        const successResponse = Buffer.from([0x90, 0x00])
        mockTransport.exchange.mockResolvedValue(successResponse as never)

        await openAppWithTimers(appType)

        // @ts-ignore
        const apdu = mockTransport.exchange.mock.calls[
          mockTransport.exchange.mock.calls.length - 1
        ][0] as Buffer

        // Verify APDU structure
        expect(apdu[0]).toBe(0xe0)
        expect(apdu[1]).toBe(0xd8)
        expect(apdu[2]).toBe(0x00)
        expect(apdu[3]).toBe(0x00)
        expect(apdu[4]).toBe(appType.length)

        // Verify app name
        const appNameBytes = apdu.slice(5)
        expect(appNameBytes.toString('ascii')).toBe(appType)
      }
    })

    it('should handle response with data before status word', async () => {
      const appType = LedgerAppType.AVALANCHE

      // Mock response with some data followed by success status word
      const responseWithData = Buffer.from([0x01, 0x02, 0x03, 0x90, 0x00])
      mockTransport.exchange.mockResolvedValue(responseWithData as never)

      await openAppWithTimers(appType)

      // Should extract status word correctly from the last 2 bytes
      expect(Logger.info).toHaveBeenCalledWith(
        `Successfully opened ${appType} app on Ledger device using APDU`
      )
    })

    it('should format status codes with proper padding', async () => {
      const appType = LedgerAppType.AVALANCHE

      // Mock response with low byte values that need padding (0x0001)
      const lowByteResponse = Buffer.from([0x00, 0x01])
      mockTransport.exchange.mockResolvedValue(lowByteResponse as never)

      await openAppWithTimers(appType)

      // Verify padding is applied correctly
      expect(Logger.info).toHaveBeenCalledWith('Unexpected status word: 0x0001')
    })

    it('should handle COMMAND_NOT_ALLOWED status code', async () => {
      const appType = LedgerAppType.ETHEREUM

      // Mock response with COMMAND_NOT_ALLOWED (0x6986)
      const errorResponse = Buffer.from([0x69, 0x86]) as never
      mockTransport.exchange.mockResolvedValue(errorResponse)

      await openAppWithTimers(appType)

      expect(Logger.info).toHaveBeenCalledWith('Unexpected status word: 0x6986')
    })

    it('should handle minimum valid response (2 bytes)', async () => {
      const appType = LedgerAppType.SOLANA

      // Minimum valid response is 2 bytes (SW1, SW2)
      const minResponse = Buffer.from([0x90, 0x00]) as never
      mockTransport.exchange.mockResolvedValue(minResponse)

      await openAppWithTimers(appType)

      expect(Logger.info).toHaveBeenCalledWith(
        `Successfully opened ${appType} app on Ledger device using APDU`
      )
    })
  })

  describe('buildOpenAppApdu', () => {
    it('should build correct APDU structure', () => {
      const appName = 'TestApp'

      // @ts-ignore - testing private method
      const apdu = LedgerService.buildOpenAppApdu(appName) as Buffer

      // Verify header
      expect(apdu[0]).toBe(0xe0) // CLA
      expect(apdu[1]).toBe(0xd8) // INS
      expect(apdu[2]).toBe(0x00) // P1
      expect(apdu[3]).toBe(0x00) // P2
      expect(apdu[4]).toBe(appName.length) // Lc

      // Verify data (app name)
      const dataBytes = apdu.slice(5)
      expect(dataBytes.toString('ascii')).toBe(appName)

      // Verify total length
      expect(apdu.length).toBe(5 + appName.length)
    })

    it('should handle empty app name', () => {
      const appName = ''

      // @ts-ignore - testing private method
      const apdu = LedgerService.buildOpenAppApdu(appName) as Buffer

      expect(apdu[4]).toBe(0) // Lc = 0
      expect(apdu.length).toBe(5) // Header only
    })

    it('should handle long app name', () => {
      const appName = 'VeryLongApplicationName'

      // @ts-ignore - testing private method
      const apdu = LedgerService.buildOpenAppApdu(appName) as Buffer

      expect(apdu[4]).toBe(appName.length)
      expect(apdu.slice(5).toString('ascii')).toBe(appName)
      expect(apdu.length).toBe(5 + appName.length)
    })

    it('should encode app name as ASCII bytes', () => {
      const appName = 'Avalanche'

      // @ts-ignore - testing private method
      const apdu = LedgerService.buildOpenAppApdu(appName) as Buffer

      const expectedBytes = Buffer.from(appName, 'ascii')
      const actualBytes = apdu.slice(5)

      expect(actualBytes).toEqual(expectedBytes)
    })
  })

  describe('bluetooth permissions', () => {
    const transportBLEMock = TransportBLE as unknown as {
      open: jest.Mock
      listen: jest.Mock
      disconnectDevice: jest.Mock
    }

    const bluetoothPermissions = [
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    ].filter(
      (
        permission
      ): permission is typeof PermissionsAndroid.PERMISSIONS[keyof typeof PermissionsAndroid.PERMISSIONS] =>
        Boolean(permission)
    )

    const makePermissionResult = (
      status: typeof PermissionsAndroid.RESULTS[keyof typeof PermissionsAndroid.RESULTS]
    ): Record<string, string> => {
      return Object.fromEntries(
        bluetoothPermissions.map(permission => [permission, status])
      )
    }

    const grantedPermissions = makePermissionResult(
      PermissionsAndroid.RESULTS.GRANTED
    )

    const deniedPermissions = makePermissionResult(
      PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
    )

    const mockTransport = {
      id: 'test-device-id',
      exchange: jest.fn().mockRejectedValue(new Error('No app info') as never),
      isConnected: true,
      close: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      exchangeBusyPromise: null
    }

    const originalPlatformOS = Platform.OS

    beforeEach(() => {
      jest.useFakeTimers()
      jest.spyOn(Logger, 'info').mockImplementation(jest.fn())
      jest.spyOn(Logger, 'error').mockImplementation(jest.fn())
      jest.spyOn(Alert, 'alert').mockImplementation(jest.fn())
      jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(false as never)
      jest
        .spyOn(PermissionsAndroid, 'requestMultiple')
        .mockResolvedValue(grantedPermissions as never)

      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: 'android'
      })

      transportBLEMock.listen.mockReturnValue({
        unsubscribe: jest.fn()
      })
      transportBLEMock.disconnectDevice.mockResolvedValue(undefined as never)
      transportBLEMock.open.mockResolvedValue(mockTransport as never)
    })

    afterEach(async () => {
      await LedgerService.disconnect().catch(() => undefined)
      LedgerService.stopDeviceScanning()
      LedgerService.stopAppPolling()
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: originalPlatformOS
      })
      jest.restoreAllMocks()
    })

    it('requests permissions when scanning for devices', async () => {
      await LedgerService.startDeviceScanning(jest.fn())

      expect(PermissionsAndroid.check).toHaveBeenCalledTimes(
        bluetoothPermissions.length
      )
      expect(PermissionsAndroid.requestMultiple).toHaveBeenCalledWith(
        bluetoothPermissions
      )
      expect(transportBLEMock.listen).toHaveBeenCalledTimes(1)
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

      expect(transportBLEMock.listen).not.toHaveBeenCalled()
      expect(Alert.alert).not.toHaveBeenCalled()
    })

    it('requests permissions when establishing a connection', async () => {
      await LedgerService.connect('device-id')

      expect(PermissionsAndroid.check).toHaveBeenCalledTimes(
        bluetoothPermissions.length
      )
      expect(PermissionsAndroid.requestMultiple).toHaveBeenCalledWith(
        bluetoothPermissions
      )
      expect(transportBLEMock.open).toHaveBeenCalledWith(
        'device-id',
        expect.any(Number)
      )
    })

    it('does not reopen permission prompts when permissions are already granted', async () => {
      ;(PermissionsAndroid.check as jest.Mock).mockResolvedValue(true as never)

      await LedgerService.connect('device-id')

      expect(PermissionsAndroid.requestMultiple).not.toHaveBeenCalled()
      expect(transportBLEMock.open).toHaveBeenCalledWith(
        'device-id',
        expect.any(Number)
      )
    })

    it('fails connection before opening transport when permissions are denied', async () => {
      ;(PermissionsAndroid.requestMultiple as jest.Mock).mockResolvedValue(
        deniedPermissions as never
      )

      try {
        await LedgerService.connect('device-id')
        throw new Error('Expected connect to fail')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe(
          'Bluetooth permissions are required to connect to Ledger devices.'
        )
        expect(
          isLedgerBluetoothError(error) &&
            error.code === LEDGER_ERROR_CODES.BLUETOOTH_PERMISSION
        ).toBe(true)
      }

      expect(transportBLEMock.open).not.toHaveBeenCalled()
      expect(Alert.alert).not.toHaveBeenCalled()
    })
  })

  describe('connect retry behavior', () => {
    const transportBLEMock = TransportBLE as unknown as {
      open: jest.Mock
      disconnectDevice: jest.Mock
    }

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

    const grantedPermissions = Object.fromEntries(
      bluetoothPermissions.map(p => [p, PermissionsAndroid.RESULTS.GRANTED])
    )

    const mockTransport = {
      id: 'test-device-id',
      exchange: jest.fn().mockRejectedValue(new Error('No app info') as never),
      isConnected: true,
      close: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      exchangeBusyPromise: null
    }

    const DEVICE_ID = 'test-device-id'
    const originalPlatformOS = Platform.OS

    beforeEach(() => {
      jest.useFakeTimers()
      jest.spyOn(Logger, 'info').mockImplementation(jest.fn())
      jest.spyOn(Logger, 'error').mockImplementation(jest.fn())
      jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(false as never)
      jest
        .spyOn(PermissionsAndroid, 'requestMultiple')
        .mockResolvedValue(grantedPermissions as never)
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: 'android'
      })
      transportBLEMock.disconnectDevice.mockResolvedValue(undefined as never)
      transportBLEMock.open.mockResolvedValue(mockTransport as never)
    })

    afterEach(async () => {
      await LedgerService.disconnect().catch(() => undefined)
      LedgerService.stopAppPolling()
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: originalPlatformOS
      })
      jest.restoreAllMocks()
    })

    it('does not retry on a generic non-retryable error', async () => {
      transportBLEMock.open.mockRejectedValueOnce(
        new Error('Unexpected transport error') as never
      )

      await expect(LedgerService.connect(DEVICE_ID)).rejects.toThrow(
        'Failed to connect to Ledger: Unexpected transport error'
      )
      expect(transportBLEMock.open).toHaveBeenCalledTimes(1)
    })
  })

  describe('connectInFlight', () => {
    const transportBLEMock = TransportBLE as unknown as {
      open: jest.Mock
      disconnectDevice: jest.Mock
    }

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

    const grantedPermissions = Object.fromEntries(
      bluetoothPermissions.map(p => [p, PermissionsAndroid.RESULTS.GRANTED])
    )

    const DEVICE_ID = 'test-device-id'
    const originalPlatformOS = Platform.OS

    let mockTransport: {
      id: string
      exchange: jest.Mock
      isConnected: boolean
      close: jest.Mock
      on: jest.Mock
      off: jest.Mock
      exchangeBusyPromise: null
    }

    beforeEach(() => {
      jest.useFakeTimers()
      jest.spyOn(Logger, 'info').mockImplementation(jest.fn())
      jest.spyOn(Logger, 'error').mockImplementation(jest.fn())
      jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(false as never)
      jest
        .spyOn(PermissionsAndroid, 'requestMultiple')
        .mockResolvedValue(grantedPermissions as never)
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: 'android'
      })

      mockTransport = {
        id: DEVICE_ID,
        exchange: jest
          .fn()
          .mockRejectedValue(new Error('No app info') as never),
        isConnected: true,
        close: jest.fn().mockResolvedValue(undefined as never),
        on: jest.fn(),
        off: jest.fn(),
        exchangeBusyPromise: null
      }

      transportBLEMock.disconnectDevice.mockResolvedValue(undefined as never)
    })

    afterEach(async () => {
      await LedgerService.disconnect().catch(() => undefined)
      LedgerService.stopAppPolling()
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: originalPlatformOS
      })
      jest.restoreAllMocks()
    })

    it('concurrent connect() calls share the same in-flight promise', async () => {
      // Make open() slow so the second call arrives while the first is pending
      transportBLEMock.open.mockImplementation(
        () =>
          new Promise(resolve => setTimeout(() => resolve(mockTransport), 100))
      )

      const promise1 = LedgerService.connect(DEVICE_ID)
      const promise2 = LedgerService.connect(DEVICE_ID)

      // Advance past the open() delay
      await jest.advanceTimersByTimeAsync(200)

      await Promise.all([promise1, promise2])

      // TransportBLE.open should only have been called once
      expect(transportBLEMock.open).toHaveBeenCalledTimes(1)
      expect(Logger.info).toHaveBeenCalledWith(
        'connect() already in flight — joining existing attempt'
      )
    })

    it('concurrent callers all reject when the in-flight connect fails', async () => {
      transportBLEMock.open.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('BLE open failed')), 100)
          )
      )

      const promise1 = LedgerService.connect(DEVICE_ID)
      const promise2 = LedgerService.connect(DEVICE_ID)

      // Attach rejection handlers BEFORE advancing timers to avoid
      // unhandled-rejection noise from Jest.
      const assertion1 = expect(promise1).rejects.toThrow(
        'Failed to connect to Ledger'
      )
      const assertion2 = expect(promise2).rejects.toThrow(
        'Failed to connect to Ledger'
      )

      await jest.advanceTimersByTimeAsync(200)

      await assertion1
      await assertion2

      expect(transportBLEMock.open).toHaveBeenCalledTimes(1)
    })

    it('allows a fresh connect() after a failed in-flight attempt resolves', async () => {
      // First call fails
      transportBLEMock.open.mockRejectedValueOnce(
        new Error('BLE open failed') as never
      )

      await expect(LedgerService.connect(DEVICE_ID)).rejects.toThrow()

      // connectInFlight should be cleared — a new connect() should start fresh
      transportBLEMock.open.mockResolvedValueOnce(mockTransport as never)

      await LedgerService.connect(DEVICE_ID)

      expect(transportBLEMock.open).toHaveBeenCalledTimes(2)
    })

    it('rejects when a different device tries to connect while one is in-flight', async () => {
      // Make open() slow so device-A is still in-flight
      transportBLEMock.open.mockImplementation(
        () =>
          new Promise(resolve => setTimeout(() => resolve(mockTransport), 100))
      )

      const deviceAPromise = LedgerService.connect(DEVICE_ID)

      // Device B arrives while device A is in-flight — should reject
      // immediately since the throw happens before any await.
      const deviceBResult = await LedgerService.connect('other-device').then(
        () => 'resolved',
        (error: Error) => error.message
      )

      expect(deviceBResult).toEqual(
        `Connection to ${DEVICE_ID} already in progress`
      )

      // Device A should still complete normally
      await jest.advanceTimersByTimeAsync(200)
      await deviceAPromise

      expect(transportBLEMock.open).toHaveBeenCalledTimes(1)
    })
  })

  describe('waitForApp', () => {
    const transportBLEMock = TransportBLE as unknown as {
      open: jest.Mock
      disconnectDevice: jest.Mock
    }

    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      jest.spyOn(Logger, 'info').mockImplementation(() => {})
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      jest.spyOn(Logger, 'error').mockImplementation(() => {})
    })

    afterEach(async () => {
      await LedgerService.disconnect().catch(() => undefined)
      jest.clearAllMocks()
      jest.useRealTimers()
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

      // Establish a connected transport so pollForApp doesn't bail early
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
      const mockTransport = {
        id: 'test-device',
        exchange: jest
          .fn()
          .mockRejectedValue(new Error('No app info') as never),
        isConnected: true,
        close: jest.fn().mockResolvedValue(undefined as never),
        on: jest.fn(),
        off: jest.fn(),
        exchangeBusyPromise: null
      }
      transportBLEMock.open.mockResolvedValue(mockTransport as never)
      transportBLEMock.disconnectDevice.mockResolvedValue(undefined as never)
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: 'android'
      })
      await LedgerService.connect('test-device')

      // Make checkApp always return false (app never opens)
      const checkAppSpy = jest
        .spyOn(LedgerService as any, 'checkApp')
        .mockResolvedValue(false)

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
      const rejectPromise = expect(waitPromise).rejects.toThrow(
        LEDGER_ERROR_CODES.USER_CANCELLED
      )

      // Advance past the next polling tick so any remaining cleanup runs
      await jest.advanceTimersByTimeAsync(LEDGER_TIMEOUTS.APP_CHECK_DELAY + 100)

      await rejectPromise

      checkAppSpy.mockRestore()
    })
  })

  describe('scan errors', () => {
    const transportBLEMock = TransportBLE as unknown as {
      listen: jest.Mock
      disconnectDevice: jest.Mock
    }

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

    const grantedPermissions = Object.fromEntries(
      bluetoothPermissions.map(p => [p, PermissionsAndroid.RESULTS.GRANTED])
    )

    const originalPlatformOS = Platform.OS

    beforeEach(() => {
      jest.useFakeTimers()
      jest.spyOn(Logger, 'info').mockImplementation(jest.fn())
      jest.spyOn(Logger, 'error').mockImplementation(jest.fn())
      jest.spyOn(Alert, 'alert').mockImplementation(jest.fn())
      jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(false as never)
      jest
        .spyOn(PermissionsAndroid, 'requestMultiple')
        .mockResolvedValue(grantedPermissions as never)
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: 'android'
      })
      transportBLEMock.listen.mockReturnValue({ unsubscribe: jest.fn() })
      transportBLEMock.disconnectDevice.mockResolvedValue(undefined as never)
    })

    afterEach(async () => {
      await LedgerService.disconnect().catch(() => undefined)
      LedgerService.stopDeviceScanning()
      LedgerService.stopAppPolling()
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: originalPlatformOS
      })
      jest.restoreAllMocks()
    })

    it('calls onScanError (not Alert.alert) when TransportBLE.listen fires a non-BLE error', async () => {
      const onScanError = jest.fn()

      const scanError = new Error('Hardware failure')
      transportBLEMock.listen.mockImplementation(observer => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(observer as any).error(scanError)
        return { unsubscribe: jest.fn() }
      })

      await LedgerService.startDeviceScanning(onScanError)

      expect(onScanError).toHaveBeenCalledTimes(1)
      expect(onScanError).toHaveBeenCalledWith({
        title: 'Scan Error',
        message: `Failed to scan for devices: ${scanError.message}`
      })
      expect(Alert.alert).not.toHaveBeenCalled()
    })

    it('calls showBluetoothErrorAlert (not onScanError) when TransportBLE.listen fires a BLE error', async () => {
      const onScanError = jest.fn()

      const bleError = ledgerBluetoothErrors.radioOff()
      transportBLEMock.listen.mockImplementation(observer => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(observer as any).error(bleError)
        return { unsubscribe: jest.fn() }
      })

      await LedgerService.startDeviceScanning(onScanError)

      expect(onScanError).not.toHaveBeenCalled()
      expect(Alert.alert).toHaveBeenCalledTimes(1)
    })

    it('calls onScanError with LEDGER_SCAN_FAILED title when scan times out with no devices', async () => {
      const onScanError = jest.fn()

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

      transportBLEMock.listen.mockImplementation(observer => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(observer as any).next({
          type: 'add',
          descriptor: { id: 'device-1', name: 'Ledger Nano X' }
        })
        return { unsubscribe: jest.fn() }
      })

      await LedgerService.startDeviceScanning(onScanError)

      jest.advanceTimersByTime(LEDGER_TIMEOUTS.SCAN_TIMEOUT + 100)

      expect(onScanError).not.toHaveBeenCalled()
    })

    it('calls onScanError when TransportBLE.listen throws synchronously', async () => {
      const onScanError = jest.fn()

      const syncError = new Error('Listen threw synchronously')
      transportBLEMock.listen.mockImplementation(() => {
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

  describe('app polling pause/resume', () => {
    let getCurrentAppInfoSpy: jest.SpyInstance

    beforeEach(() => {
      jest.useFakeTimers()

      jest.spyOn(Logger, 'info').mockImplementation(() => {})
      jest.spyOn(Logger, 'error').mockImplementation(() => {})

      // Mock getCurrentAppInfo to simulate a connected transport returning
      // valid app info. This avoids needing to set the true-private #transport
      // field which the polling callback checks before calling getCurrentAppInfo.
      getCurrentAppInfoSpy = jest
        .spyOn(LedgerService as any, 'getCurrentAppInfo')
        .mockResolvedValue({
          applicationName: 'Avalanche',
          version: '0.9.1'
        })

      // Bypass the #transport null-check inside the polling interval by
      // stubbing the internal field check. The polling callback does:
      //   if (!this.#transport || !this.#transport.isConnected) { ... }
      // We can't set #transport from outside, so we override the entire
      // polling method to remove that guard while keeping pause/resume logic.
      // Instead, we set #transport indirectly by calling the prototype setter.
      const protoDesc = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(LedgerService),
        'transport'
      )
      if (protoDesc?.set) {
        // The setter does: this.#transport = transport
        // We pass a minimal object that satisfies the isConnected check.
        protoDesc.set.call(LedgerService, { isConnected: true })
      }
    })

    afterEach(() => {
      jest.useRealTimers()
      jest.clearAllMocks()
      LedgerService.stopAppPolling()
    })

    it('should skip getCurrentAppInfo when polling is paused', async () => {
      // @ts-ignore - accessing private for testing
      LedgerService.appPollingEnabled = false
      // @ts-ignore
      LedgerService.startAppPolling()

      // Normal polling should fire and call getCurrentAppInfo
      await jest.advanceTimersByTimeAsync(
        LEDGER_TIMEOUTS.APP_POLLING_INTERVAL + 100
      )
      expect(getCurrentAppInfoSpy).toHaveBeenCalled()

      // Pause polling
      LedgerService.pauseAppPolling()

      // Advance past several polling intervals
      getCurrentAppInfoSpy.mockClear()
      await jest.advanceTimersByTimeAsync(
        LEDGER_TIMEOUTS.APP_POLLING_INTERVAL * 3
      )

      // No new calls should have been made while paused
      expect(getCurrentAppInfoSpy).not.toHaveBeenCalled()
    })

    it('should resume getCurrentAppInfo after resumeAppPolling', async () => {
      // @ts-ignore
      LedgerService.appPollingEnabled = false
      // @ts-ignore
      LedgerService.startAppPolling()

      // Pause then resume
      LedgerService.pauseAppPolling()
      LedgerService.resumeAppPolling()

      // Advance past a polling interval
      getCurrentAppInfoSpy.mockClear()
      await jest.advanceTimersByTimeAsync(
        LEDGER_TIMEOUTS.APP_POLLING_INTERVAL + 100
      )

      // Calls should have resumed
      expect(getCurrentAppInfoSpy).toHaveBeenCalled()
    })
  })

  describe('wrapTransportExchange', () => {
    let mockTransport: {
      exchange: jest.Mock
      isConnected: boolean
      close: jest.Mock
      exchangeBusyPromise: Promise<void> | null
    }
    let protoDesc: PropertyDescriptor | undefined

    beforeEach(() => {
      jest.useFakeTimers()

      mockTransport = {
        exchange: jest.fn(),
        isConnected: true,
        close: jest.fn(),
        exchangeBusyPromise: null
      }

      jest.spyOn(Logger, 'info').mockImplementation(() => {})
      jest.spyOn(Logger, 'error').mockImplementation(() => {})

      // Use the prototype setter to set the real #transport private field
      protoDesc = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(LedgerService),
        'transport'
      )
      if (protoDesc?.set) {
        protoDesc.set.call(LedgerService, mockTransport)
      }
    })

    afterEach(() => {
      jest.useRealTimers()
      jest.clearAllMocks()
      // Clear transport to avoid leaking state
      if (protoDesc?.set) {
        protoDesc.set.call(LedgerService, null)
      }
    })

    it('should await exchangeBusyPromise before sending APDU', async () => {
      const callOrder: string[] = []
      let resolveBusy!: () => void
      mockTransport.exchangeBusyPromise = new Promise<void>(resolve => {
        resolveBusy = resolve
      })

      const originalExchange = jest.fn().mockImplementation(async () => {
        callOrder.push('exchange')
        return Buffer.from([0x90, 0x00])
      })
      mockTransport.exchange = originalExchange

      // @ts-ignore - accessing private
      LedgerService.wrapTransportExchange()

      const exchangePromise = mockTransport.exchange(Buffer.from([0xe0, 0x01]))

      // Advance past the fixed REQUEST_DELAY timeout.
      // With the buggy implementation, this causes the exchange to fire
      // even though the busy promise hasn't resolved yet.
      await jest.advanceTimersByTimeAsync(LEDGER_TIMEOUTS.REQUEST_DELAY + 100)

      // The exchange should NOT have been called yet because
      // the busy promise is still unresolved
      // @ts-ignore - Detox expect overloads conflict with Jest expect
      expect(originalExchange).not.toHaveBeenCalled()

      // Now resolve the busy promise
      callOrder.push('busy-resolved')
      resolveBusy()

      await exchangePromise

      // @ts-ignore - Detox expect overloads conflict with Jest expect for arrays
      expect(callOrder).toEqual(['busy-resolved', 'exchange'])
    })
  })

  describe('getSolanaKeysForRange', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      jest.spyOn(Logger, 'info').mockImplementation(() => {})
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      jest.spyOn(Logger, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

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

  describe('auto-reconnect', () => {
    const transportBLEMock = TransportBLE as unknown as {
      open: jest.Mock
      disconnectDevice: jest.Mock
    }

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

    const grantedPermissions = Object.fromEntries(
      bluetoothPermissions.map(p => [p, PermissionsAndroid.RESULTS.GRANTED])
    )

    const DEVICE_ID = 'test-device-id'
    const originalPlatformOS = Platform.OS

    let disconnectHandler: (() => void) | null = null
    let mockTransport: {
      id: string
      exchange: jest.Mock
      isConnected: boolean
      close: jest.Mock
      on: jest.Mock
      off: jest.Mock
      exchangeBusyPromise: null
    }

    beforeEach(() => {
      jest.useFakeTimers()
      jest.spyOn(Logger, 'info').mockImplementation(jest.fn())
      jest.spyOn(Logger, 'error').mockImplementation(jest.fn())
      jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(false as never)
      jest
        .spyOn(PermissionsAndroid, 'requestMultiple')
        .mockResolvedValue(grantedPermissions as never)
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: 'android'
      })

      disconnectHandler = null
      mockTransport = {
        id: DEVICE_ID,
        exchange: jest
          .fn()
          .mockRejectedValue(new Error('No app info') as never),
        isConnected: true,
        close: jest.fn().mockResolvedValue(undefined as never),
        on: jest.fn((_event, callback) => {
          disconnectHandler = callback as () => void
        }),
        off: jest.fn(),
        exchangeBusyPromise: null
      }

      transportBLEMock.disconnectDevice.mockResolvedValue(undefined as never)
      transportBLEMock.open.mockResolvedValue(mockTransport as never)
    })

    afterEach(async () => {
      await LedgerService.disconnect().catch(() => undefined)
      LedgerService.forgetDevice()
      LedgerService.stopAppPolling()
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: originalPlatformOS
      })
      jest.restoreAllMocks()
    })

    /** Connect the device then clear mocks so assertions only cover
     *  reconnect-related calls. Stops polling to avoid timer interference. */
    async function connectAndReset(): Promise<void> {
      await LedgerService.connect(DEVICE_ID)
      LedgerService.stopAppPolling()
      transportBLEMock.open.mockClear()
      transportBLEMock.disconnectDevice.mockClear()
    }

    it('notifies listeners and triggers reconnect on unexpected BLE disconnect', async () => {
      await connectAndReset()

      const listener = jest.fn()
      const unsubscribe = LedgerService.addConnectionStateListener(listener)

      // Simulate the BLE transport firing a disconnect event
      expect(disconnectHandler).not.toBeNull()
      disconnectHandler!()

      // Listener should be notified of disconnection immediately
      expect(listener).toHaveBeenCalledWith(false)

      // Flush microtasks so the async reconnect attempt starts
      await jest.advanceTimersByTimeAsync(0)

      // connect() should have been called for the first reconnect attempt
      expect(transportBLEMock.open).toHaveBeenCalledWith(
        DEVICE_ID,
        expect.any(Number)
      )

      unsubscribe()
    })

    it('ignores late-firing disconnect event when transport is already null', async () => {
      await connectAndReset()
      const savedHandler = disconnectHandler

      const listener = jest.fn()
      const unsubscribe = LedgerService.addConnectionStateListener(listener)

      // Programmatic disconnect clears #transport before the event fires
      await LedgerService.disconnect({ manual: false })
      listener.mockClear()
      transportBLEMock.open.mockClear()

      // Late-firing event from old transport object — should be a no-op
      savedHandler?.()
      await jest.advanceTimersByTimeAsync(0)

      // Listener should NOT be notified again
      expect(listener).not.toHaveBeenCalled()

      unsubscribe()
    })

    it('does not auto-reconnect after manual disconnect', async () => {
      await connectAndReset()

      // manual = true sets autoReconnectDisabled
      await LedgerService.disconnect({ manual: true })
      transportBLEMock.open.mockClear()

      LedgerService.scheduleReconnect('test-trigger')
      await jest.advanceTimersByTimeAsync(0)

      expect(transportBLEMock.open).not.toHaveBeenCalled()
    })

    it('does not auto-reconnect when connectedDeviceId has been cleared', async () => {
      await connectAndReset()

      // Simulates wallet switch clearing the device reference
      LedgerService.forgetDevice()

      LedgerService.scheduleReconnect('test-trigger')
      await jest.advanceTimersByTimeAsync(0)

      expect(transportBLEMock.open).not.toHaveBeenCalled()
    })

    it('does not start a second reconnect loop while one is in progress', async () => {
      await connectAndReset()

      // All reconnect attempts fail so the loop stays busy
      transportBLEMock.open.mockRejectedValue(
        new Error('Connection failed') as never
      )

      LedgerService.scheduleReconnect('first-trigger')
      // First attempt fires and fails
      await jest.advanceTimersByTimeAsync(0)
      const callsAfterFirst = transportBLEMock.open.mock.calls.length

      // Second trigger while the first loop is still running
      LedgerService.scheduleReconnect('second-trigger')
      await jest.advanceTimersByTimeAsync(0)

      // No additional connect calls from the second trigger
      expect(transportBLEMock.open.mock.calls.length).toBe(callsAfterFirst)
    })

    it('succeeds on a later retry attempt and stops retrying', async () => {
      await connectAndReset()

      // First reconnect attempt fails, second succeeds
      transportBLEMock.open
        .mockRejectedValueOnce(new Error('Connection failed') as never)
        .mockResolvedValueOnce(mockTransport as never)

      const listener = jest.fn()
      const unsubscribe = LedgerService.addConnectionStateListener(listener)

      LedgerService.scheduleReconnect('test-trigger')

      // Attempt 1 fires and fails
      await jest.advanceTimersByTimeAsync(0)
      expect(transportBLEMock.open).toHaveBeenCalledTimes(1)

      // Wait for backoff: 1000 * 2^0 = 1000ms
      await jest.advanceTimersByTimeAsync(LEDGER_TIMEOUTS.RECONNECT_BASE_DELAY)

      // Attempt 2 succeeds
      expect(transportBLEMock.open).toHaveBeenCalledTimes(2)
      expect(listener).toHaveBeenCalledWith(true)

      unsubscribe()
    })

    it('notifies listeners of failure after all retries are exhausted', async () => {
      await connectAndReset()

      transportBLEMock.open.mockRejectedValue(
        new Error('Connection failed') as never
      )

      const listener = jest.fn()
      const unsubscribe = LedgerService.addConnectionStateListener(listener)

      LedgerService.scheduleReconnect('test-trigger')

      // Attempt 1 → fails → 1000ms delay
      await jest.advanceTimersByTimeAsync(0)
      // Attempt 2 → fails → 2000ms delay
      await jest.advanceTimersByTimeAsync(LEDGER_TIMEOUTS.RECONNECT_BASE_DELAY)
      // Attempt 3 → fails → no delay (last attempt)
      await jest.advanceTimersByTimeAsync(
        LEDGER_TIMEOUTS.RECONNECT_BASE_DELAY * 2
      )
      // Let the final promise chain settle
      await jest.advanceTimersByTimeAsync(0)

      expect(transportBLEMock.open).toHaveBeenCalledTimes(
        LEDGER_TIMEOUTS.RECONNECT_MAX_RETRIES
      )
      // Final notification indicates failure
      expect(listener).toHaveBeenLastCalledWith(false)

      unsubscribe()
    })

    it('applies exponential backoff between retry attempts', async () => {
      await connectAndReset()

      transportBLEMock.open.mockRejectedValue(
        new Error('Connection failed') as never
      )

      LedgerService.scheduleReconnect('test-trigger')

      // Attempt 1 fires immediately
      await jest.advanceTimersByTimeAsync(0)
      expect(transportBLEMock.open).toHaveBeenCalledTimes(1)

      // Backoff after attempt 1: 1000 * 2^0 = 1000ms
      // 999ms is not enough
      await jest.advanceTimersByTimeAsync(999)
      expect(transportBLEMock.open).toHaveBeenCalledTimes(1)

      // At exactly 1000ms: attempt 2 fires
      await jest.advanceTimersByTimeAsync(1)
      expect(transportBLEMock.open).toHaveBeenCalledTimes(2)

      // Backoff after attempt 2: 1000 * 2^1 = 2000ms
      // 1999ms is not enough
      await jest.advanceTimersByTimeAsync(1999)
      expect(transportBLEMock.open).toHaveBeenCalledTimes(2)

      // At exactly 2000ms: attempt 3 fires
      await jest.advanceTimersByTimeAsync(1)
      expect(transportBLEMock.open).toHaveBeenCalledTimes(3)
    })

    it('allows a new reconnect loop after the previous one finishes', async () => {
      await connectAndReset()

      // First loop: all attempts fail
      transportBLEMock.open.mockRejectedValue(
        new Error('Connection failed') as never
      )

      LedgerService.scheduleReconnect('first-loop')

      // Exhaust all retries
      await jest.advanceTimersByTimeAsync(0)
      await jest.advanceTimersByTimeAsync(LEDGER_TIMEOUTS.RECONNECT_BASE_DELAY)
      await jest.advanceTimersByTimeAsync(
        LEDGER_TIMEOUTS.RECONNECT_BASE_DELAY * 2
      )
      await jest.advanceTimersByTimeAsync(0)

      expect(transportBLEMock.open).toHaveBeenCalledTimes(
        LEDGER_TIMEOUTS.RECONNECT_MAX_RETRIES
      )

      // isAttemptingReconnect should be reset — a fresh loop can start
      transportBLEMock.open.mockReset()
      transportBLEMock.open.mockResolvedValueOnce(mockTransport as never)

      LedgerService.scheduleReconnect('second-loop')
      await jest.advanceTimersByTimeAsync(0)

      expect(transportBLEMock.open).toHaveBeenCalledTimes(1)
    })
  })
})
