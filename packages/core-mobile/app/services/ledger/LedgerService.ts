import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import Transport from '@ledgerhq/hw-transport'
import AppAvalanche from '@avalabs/hw-app-avalanche'
import AppSolana from '@ledgerhq/hw-app-solana'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import {
  getAddressDerivationPath,
  handleLedgerError
} from 'services/wallet/utils'
import {
  getBtcAddressFromPubKey,
  getSolanaPublicKeyFromLedger,
  getLedgerAppInfo
} from '@avalabs/core-wallets-sdk'
import { networks } from 'bitcoinjs-lib'
import { networkIDs } from '@avalabs/avalanchejs'
import Logger from 'utils/Logger'
import bs58 from 'bs58'
import { Alert } from 'react-native'
import {
  LEDGER_TIMEOUTS,
  getSolanaDerivationPath
} from 'new/features/ledger/consts'
import { isBitcoinCompatibleApp } from 'new/features/ledger/utils'
import { assertNotNull } from 'utils/assertions'
import { Curve } from 'utils/publicKeys'
import { stripAddressPrefix } from 'common/utils/stripAddressPrefix'
import { derivePublicKey, extendedPublicKeyToXpub } from 'utils/bip32'
import { BluetoothState } from 'services/bluetooth/types'
import BluetoothService from 'services/bluetooth/BluetoothService'
import {
  AddressInfo,
  LedgerAddressType,
  ExtendedPublicKey,
  PublicKeyInfo,
  LedgerAppType,
  LedgerReturnCode,
  AppInfo,
  LedgerDevice,
  AvalancheKey,
  LEDGER_ERROR_CODES,
  LedgerDerivationPathType
} from './types'
import {
  isLedgerBluetoothError,
  ledgerBluetoothErrors,
  showBluetoothErrorAlert
} from './LedgerBluetoothError'

class LedgerService {
  #transport: TransportBLE | null = null
  private _currentAppType: LedgerAppType = LedgerAppType.UNKNOWN
  private _currentAppVersion = ''

  private get currentAppType(): LedgerAppType {
    return this._currentAppType
  }

  private set currentAppType(value: LedgerAppType) {
    this._currentAppType = value

    // When resetting app type (e.g. at the start of a new connect()),
    // also clear the cached version to avoid using stale data.
    if (value === LedgerAppType.UNKNOWN) {
      this._currentAppVersion = ''
    }
  }

  private get currentAppVersion(): string {
    return this._currentAppVersion
  }

  private set currentAppVersion(version: string) {
    this._currentAppVersion = version
  }
  private appPollingInterval: number | null = null
  private appPollingEnabled = false
  private isDisconnected = false

  // Device scanning state
  private scanSubscription: { unsubscribe: () => void } | null = null
  private scanInterval: ReturnType<typeof setInterval> | null = null
  private deviceListeners: Set<(devices: LedgerDevice[]) => void> = new Set()
  private currentDevices: LedgerDevice[] = []
  private isScanning = false

  // Transport getter/setter with automatic error handling
  private get transport(): TransportBLE {
    assertNotNull(
      this.#transport,
      'Ledger transport is not initialized. Please connect to a device first.'
    )
    return this.#transport
  }

  private set transport(transport: TransportBLE) {
    this.#transport = transport
  }

  // Wrap transport's exchange method to automatically handle busy state
  private wrapTransportExchange(): void {
    if (!this.#transport) return
    const originalExchange = this.#transport.exchange.bind(this.#transport)

    // Replace exchange method with wrapped version
    this.#transport.exchange = async (apdu: Buffer): Promise<Buffer> => {
      // If transport is busy, wait before sending next command
      if (this.#transport?.exchangeBusyPromise) {
        await new Promise(res => setTimeout(res, LEDGER_TIMEOUTS.REQUEST_DELAY))
      }
      try {
        return await originalExchange(apdu)
      } catch (error) {
        // If error is still due to busy transport, reconnect
        if (
          error instanceof Error &&
          (error.message
            .toLowerCase()
            .includes(LEDGER_ERROR_CODES.TRANSPORT_RACE_CONDITION_ALT) ||
            error.message
              .toLowerCase()
              .includes(LEDGER_ERROR_CODES.TRANSPORT_RACE_CONDITION))
        ) {
          // wait for the transport and retry
          await new Promise(res =>
            setTimeout(res, LEDGER_TIMEOUTS.REQUEST_DELAY)
          )
          return await originalExchange(apdu)
        }
        // Other errors should be thrown immediately
        throw error
      }
    }
  }

  async assertBluetoothAvailable(): Promise<void> {
    const { hasPermission, state } =
      await BluetoothService.ensureBluetoothAvailable()

    if (!hasPermission || state === BluetoothState.UNAUTHORIZED) {
      throw ledgerBluetoothErrors.permissionDenied()
    }
    if (state === BluetoothState.POWERED_OFF) {
      throw ledgerBluetoothErrors.radioOff()
    }
    if (state === BluetoothState.UNSUPPORTED) {
      throw ledgerBluetoothErrors.unsupported()
    }
    if (
      state === BluetoothState.RESETTING ||
      state === BluetoothState.UNKNOWN
    ) {
      throw ledgerBluetoothErrors.unknown()
    }
  }

  // Connect to Ledger device (transport only, no apps)
  async connect(deviceId: string): Promise<void> {
    try {
      Logger.info('Starting BLE connection attempt with deviceId:', deviceId)
      await this.assertBluetoothAvailable()
      this.isDisconnected = false // Reset disconnect flag on new connection
      // Use a longer timeout for connection
      await TransportBLE.disconnectDevice(deviceId)

      this.transport = await TransportBLE.open(
        deviceId,
        LEDGER_TIMEOUTS.CONNECTION_TIMEOUT
      )
      Logger.info('BLE transport connected successfully')

      // Wrap the transport's exchange method to automatically handle busy state
      this.wrapTransportExchange()

      this.currentAppType = LedgerAppType.UNKNOWN

      // Start passive app detection
      Logger.info('Starting app polling...')
      this.startAppPolling()
      Logger.info('App polling started')

      // Test immediate app info call and update currentAppType
      try {
        const testAppInfo = await this.getCurrentAppInfo()
        // Update currentAppType immediately so waitForApp doesn't have to wait
        const detectedAppType = this.mapAppNameToType(
          testAppInfo.applicationName
        )
        Logger.info(`Immediately detected app type: ${detectedAppType}`)
        this.currentAppType = detectedAppType
        this.currentAppVersion = testAppInfo.version
      } catch (error) {
        Logger.info(
          'Immediate get current app info failed, will rely on polling'
        )
      }
    } catch (error) {
      Logger.error('Failed to connect to Ledger', error)
      if (isLedgerBluetoothError(error)) {
        throw error
      }
      throw new Error(
        `Failed to connect to Ledger: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  // Start passive app detection polling
  private startAppPolling(): void {
    if (this.appPollingEnabled) {
      return
    }

    this.appPollingEnabled = true
    this.appPollingInterval = setInterval(async () => {
      try {
        if (!this.#transport || !this.#transport.isConnected) {
          this.stopAppPolling()
          return
        }

        const appInfo = await this.getCurrentAppInfo()
        const newAppType = this.mapAppNameToType(appInfo.applicationName)

        if (newAppType !== this.currentAppType) {
          Logger.info(
            `App changed from ${this.currentAppType} to ${newAppType}`
          )
          this.currentAppType = newAppType
        }
        this.currentAppVersion = appInfo.version
      } catch (error) {
        Logger.error('Error polling app info', error)
        // Don't stop polling on error, just log it
      }
    }, LEDGER_TIMEOUTS.APP_POLLING_INTERVAL)
  }

  // Stop passive app detection polling
  stopAppPolling(): void {
    if (this.appPollingInterval) {
      clearInterval(this.appPollingInterval)
      this.appPollingInterval = null
    }
    this.appPollingEnabled = false
  }

  // Handle scan errors (matching original implementation)
  private handleScanError(error: Error): void {
    Logger.error('Scan error:', error)
    this.stopDeviceScanning()

    if (isLedgerBluetoothError(error)) {
      showBluetoothErrorAlert(error)
      return
    }
    Alert.alert('Scan Error', `Failed to scan for devices: ${error.message}`)
  }

  // Device scanning methods (matching original implementation)
  async startDeviceScanning(): Promise<void> {
    if (this.isScanning) {
      Logger.info('Device scanning already in progress')
      return
    }

    // Request permissions first
    await this.assertBluetoothAvailable()

    Logger.info('Starting device scanning...')
    this.isScanning = true
    this.currentDevices = []

    try {
      this.scanSubscription = TransportBLE.listen({
        next: (event: {
          type: string
          descriptor: { id: string; name?: string; rssi?: number }
        }) => {
          if (event.type === 'add') {
            const device: LedgerDevice = {
              id: event.descriptor.id,
              name: event.descriptor.name || 'Unknown Device',
              rssi: event.descriptor.rssi
            }

            Logger.info('Found Ledger device:', {
              id: device.id,
              name: device.name
            })

            // Update device list (matching original logic)
            const exists = this.currentDevices.find(d => d.id === device.id)
            if (!exists) {
              this.currentDevices = [...this.currentDevices, device]
            }

            // Notify all listeners
            this.notifyDeviceListeners()
          }
        },
        error: (error: Error) => {
          this.handleScanError(error)
        },

        complete: () => {
          Logger.info('Device scanning completed')
        }
      })

      // Auto-stop scanning after timeout (matching original)
      setTimeout(() => {
        Logger.info('Scan timeout reached, stopping...')
        this.stopDeviceScanning()
      }, LEDGER_TIMEOUTS.SCAN_TIMEOUT)
    } catch (error) {
      Logger.error('Failed to start device scanning:', error)
      this.isScanning = false
      this.handleScanError(error as Error)
    }
  }

  stopDeviceScanning(): void {
    if (!this.isScanning) return

    Logger.info('Stopping device scanning...')

    if (this.scanSubscription) {
      this.scanSubscription.unsubscribe()
      this.scanSubscription = null
    }

    if (this.scanInterval) {
      clearInterval(this.scanInterval)
      this.scanInterval = null
    }

    this.isScanning = false
  }

  addDeviceListener(callback: (devices: LedgerDevice[]) => void): void {
    this.deviceListeners.add(callback)
    // Immediately notify with current devices
    callback(this.currentDevices)
  }

  removeDeviceListener(callback: (devices: LedgerDevice[]) => void): void {
    this.deviceListeners.delete(callback)
  }

  private notifyDeviceListeners(): void {
    this.deviceListeners.forEach(callback => {
      try {
        callback([...this.currentDevices])
      } catch (error) {
        Logger.error('Error in device listener callback:', error)
      }
    })
  }

  getIsScanning(): boolean {
    return this.isScanning
  }

  getCurrentDevices(): LedgerDevice[] {
    return [...this.currentDevices]
  }

  removeDevice(deviceId: string): void {
    this.currentDevices = this.currentDevices.filter(
      device => device.id !== deviceId
    )
    this.notifyDeviceListeners()
  }

  // Get current app info from device
  private async getCurrentAppInfo(): Promise<AppInfo> {
    try {
      return await getLedgerAppInfo(this.transport as Transport)
    } catch (error) {
      Logger.error('Error getting app info from SDK:', error)
      throw error
    }
  }

  // Map app name to our enum
  private mapAppNameToType(appName: string): LedgerAppType {
    const lowerAppName = appName.toLowerCase()

    switch (lowerAppName) {
      case 'avalanche':
      case 'avax':
      case 'avalanche wallet':
        return LedgerAppType.AVALANCHE
      case 'solana':
      case 'sol':
        return LedgerAppType.SOLANA
      case 'ethereum':
      case 'eth':
        return LedgerAppType.ETHEREUM
      case 'bitcoin':
        return LedgerAppType.BITCOIN
      case 'bitcoin recovery':
        return LedgerAppType.BITCOIN_RECOVERY
      default:
        Logger.info(`Unknown app name detected: "${appName}"`)
        return LedgerAppType.UNKNOWN
    }
  }

  // Returns true when detectedApp satisfies a request for requiredApp.
  // Bitcoin Recovery is accepted as a substitute for Bitcoin.
  // For the regular Bitcoin app, only versions within the supported range are accepted.
  private isAppCompatible(
    detectedApp: LedgerAppType,
    requiredApp: LedgerAppType
  ): boolean {
    if (requiredApp === LedgerAppType.BITCOIN) {
      return isBitcoinCompatibleApp(detectedApp, this.currentAppVersion)
    }
    return detectedApp === requiredApp
  }

  // Get current app type (passive detection)
  getCurrentAppType(): LedgerAppType {
    return this.currentAppType
  }

  // Get current app version (passive detection)
  getCurrentAppVersion(): string {
    return this.currentAppVersion
  }

  checkApp = async (appType: LedgerAppType): Promise<boolean> => {
    try {
      const appInfo = await this.getCurrentAppInfo()
      const detectedAppType = this.mapAppNameToType(appInfo.applicationName)

      if (detectedAppType !== this.currentAppType) {
        Logger.info(
          `App changed from ${this.currentAppType} to ${detectedAppType}`
        )
        this.currentAppType = detectedAppType
      }
      this.currentAppVersion = appInfo.version

      if (this.isAppCompatible(this.currentAppType, appType)) {
        Logger.info(
          `${appType} app is ready (detected: ${this.currentAppType})`
        )
        return true
      }
    } catch (error) {
      if (error instanceof Error) {
        handleLedgerError({ error, appType })
      }
      Logger.info('Error checking app, will continue polling')
    }
    return false
  }

  // Wait for specific app to be open (Promise-based, works with polling).
  // Accepts an optional AbortSignal so callers can cancel the wait — e.g.
  // when the user taps "Skip Solana" during onboarding.
  async waitForApp(
    appType: LedgerAppType,
    timeoutMs: number = LEDGER_TIMEOUTS.APP_WAIT_TIMEOUT,
    signal?: AbortSignal
  ): Promise<void> {
    // If the signal is already aborted before we start, reject immediately
    // so no APDU traffic is sent to the Ledger device.
    if (signal?.aborted) {
      return Promise.reject(new Error(LEDGER_ERROR_CODES.USER_CANCELLED))
    }

    // Check if app is already available — resolve before entering the
    // Promise constructor so no abort listener is registered unnecessarily.
    if (this.isAppCompatible(this.currentAppType, appType)) {
      Logger.info(`${appType} app is ready (detected: ${this.currentAppType})`)
      return Promise.resolve()
    }

    return this.pollForApp(appType, timeoutMs, signal)
  }

  // Poll the Ledger device until the requested app is open, the timeout
  // expires, or the operation is cancelled via signal/disconnect.
  private pollForApp(
    appType: LedgerAppType,
    timeoutMs: number,
    signal?: AbortSignal
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      // Wrapped in an object so pollTick's closure captures the mutable
      // reference rather than a frozen primitive boolean value.
      const state = { settled: false }
      Logger.info(`Waiting for ${appType} app (timeout: ${timeoutMs}ms)...`)

      let checkInterval: ReturnType<typeof setInterval> | null = null

      // Settle helper — prevents double resolve/reject after cleanup races.
      const settle = (outcome: 'resolve' | 'reject', error?: Error): void => {
        if (state.settled) return
        state.settled = true
        if (checkInterval) {
          clearInterval(checkInterval)
          checkInterval = null
        }
        // Stop listening for abort once settled to prevent leaks.
        if (signal) {
          signal.removeEventListener('abort', onAbort)
        }
        if (outcome === 'resolve') {
          resolve()
        } else {
          reject(error)
        }
      }

      // Abort listener — fires immediately when the signal is aborted,
      // so cancellation doesn't have to wait for the next polling tick.
      const onAbort = (): void => {
        Logger.info('Aborting waitForApp via AbortSignal')
        settle('reject', new Error(LEDGER_ERROR_CODES.USER_CANCELLED))
      }

      if (signal) {
        signal.addEventListener('abort', onAbort)
      }

      // Do immediate check, then start polling interval if not found.
      this.checkApp(appType)
        .then(appFound => {
          if (appFound) {
            settle('resolve')
            return
          }
          // Guard: if abort fired while checkApp was in-flight, settle()
          // already ran — don't start an interval that would never be cleared.
          if (state.settled) return
          checkInterval = setInterval(
            () => this.pollTick(appType, timeoutMs, startTime, state, settle),
            LEDGER_TIMEOUTS.APP_CHECK_DELAY
          )
        })
        .catch(error => {
          Logger.error('Error checking app:', error)
          settle('reject', error)
        })
    })
  }

  // Single polling tick: check timeout, disconnect, and app status.
  private async pollTick(
    appType: LedgerAppType,
    timeoutMs: number,
    startTime: number,
    state: { settled: boolean },
    settle: (outcome: 'resolve' | 'reject', error?: Error) => void
  ): Promise<void> {
    if (state.settled) return

    const elapsed = Date.now() - startTime
    if (elapsed >= timeoutMs) {
      Logger.error(`Timeout waiting for ${appType} app after ${timeoutMs}ms`)
      settle(
        'reject',
        new Error(
          `Timeout waiting for ${appType} app. Please open the ${appType} app on your Ledger device.`
        )
      )
      return
    }

    // Check if disconnect was called — abort waiting.
    // The return ensures we don't fall through to checkApp below,
    // which would send another APDU to the device. (Fixes CP-13966)
    if (this.isDisconnected) {
      Logger.info('Aborting waitForApp due to disconnect')
      settle('reject', new Error(LEDGER_ERROR_CODES.USER_CANCELLED))
      return
    }

    try {
      const isFound = await this.checkApp(appType)
      if (isFound) {
        settle('resolve')
      }
    } catch (error) {
      Logger.error(`Error while polling for ${appType} app`, error)
      settle(
        'reject',
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }

  // Check if specific app is currently open
  async isAppOpen(appType: LedgerAppType): Promise<boolean> {
    try {
      const appInfo = await this.getCurrentAppInfo()
      const currentAppType = this.mapAppNameToType(appInfo.applicationName)
      this.currentAppVersion = appInfo.version
      return this.isAppCompatible(currentAppType, appType)
    } catch (error) {
      Logger.error('Error checking app status', error)
      return false
    }
  }

  // Reconnect to device if disconnected
  private async reconnectIfNeeded(deviceId: string): Promise<void> {
    Logger.info('Checking if reconnection is needed')

    if (!this.#transport || !this.#transport.isConnected) {
      Logger.info('Transport is disconnected, attempting reconnection')
      try {
        await this.connect(deviceId)
        Logger.info('Reconnection successful')
      } catch (error) {
        Logger.error('Reconnection failed:', error)
        throw error // Re-throw to propagate the error
      }
    } else {
      Logger.info('Transport is already connected')
    }
  }

  // Get extended public keys for BIP44 derivation
  async getExtendedPublicKeys(accountIndex: number): Promise<{
    evm: ExtendedPublicKey
    avalanche: ExtendedPublicKey
  }> {
    Logger.info('=== getExtendedPublicKeys STARTED ===')
    Logger.info('Current app type:', this.currentAppType)

    // Connect to Avalanche app
    Logger.info('Waiting for Avalanche app...')
    await this.waitForApp(LedgerAppType.AVALANCHE)
    Logger.info('Avalanche app detected, creating app instance...')

    // Create Avalanche app instance
    const avalancheApp = new AppAvalanche(this.transport as Transport)
    Logger.info('Avalanche app instance created')
    try {
      // Get EVM extended public key (m/44'/60'/0')
      Logger.info('Getting EVM extended public key...')
      const evmPath = getAddressDerivationPath({
        accountIndex,
        vmType: NetworkVMType.EVM
      }).replace('/0/0', '')
      Logger.info('EVM derivation path:', evmPath)

      const evmXpubResponse = await avalancheApp.getExtendedPubKey(
        evmPath,
        false
      )

      Logger.info('EVM response return code:', evmXpubResponse.returnCode)

      // Check for error response
      if (evmXpubResponse.returnCode !== LedgerReturnCode.SUCCESS) {
        Logger.error(
          'EVM extended public key error:',
          evmXpubResponse.errorMessage
        )
        throw new Error(
          `EVM extended public key error: ${
            evmXpubResponse.errorMessage || 'Unknown error'
          }`
        )
      }

      Logger.info('EVM extended public key retrieved successfully')

      // Get Avalanche extended public key (m/44'/9000'/0')
      Logger.info('Getting Avalanche extended public key...')
      const avalanchePath = getAddressDerivationPath({
        accountIndex,
        vmType: NetworkVMType.AVM
      }).replace('/0/0', '')
      Logger.info('Avalanche derivation path:', avalanchePath)

      const avalancheXpubResponse = await avalancheApp.getExtendedPubKey(
        avalanchePath,
        false
      )

      Logger.info(
        'Avalanche response return code:',
        avalancheXpubResponse.returnCode
      )

      // Check for error response
      if (avalancheXpubResponse.returnCode !== LedgerReturnCode.SUCCESS) {
        Logger.error(
          'Avalanche extended public key error:',
          avalancheXpubResponse.errorMessage
        )
        throw new Error(
          `Avalanche extended public key error: ${
            avalancheXpubResponse.errorMessage || 'Unknown error'
          }`
        )
      }

      Logger.info('Avalanche extended public key retrieved successfully')

      return {
        evm: {
          path: evmPath,
          key: evmXpubResponse.publicKey.toString('hex'),
          chainCode: evmXpubResponse.chain_code.toString('hex')
        },
        avalanche: {
          path: avalanchePath,
          key: avalancheXpubResponse.publicKey.toString('hex'),
          chainCode: avalancheXpubResponse.chain_code.toString('hex')
        }
      }
    } catch (error) {
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('app not initialized')) {
          throw new Error(
            'Avalanche app not open on device. Please open the Avalanche app and try again.'
          )
        } else if (error.message.includes('device not found')) {
          throw new Error(
            'Ledger device not found. Please ensure your device is connected and unlocked.'
          )
        } else if (error.message.includes('returnCode')) {
          throw new Error(
            'Device returned an error. Please ensure the Avalanche app is open and ready.'
          )
        } else {
          throw new Error(
            `Failed to get extended public keys: ${error.message}`
          )
        }
      }
      Logger.error('=== getExtendedPublicKeys FAILED ===', error)
      throw new Error(`Failed to get extended public keys: ${error}`)
    }
  }

  // Check if Solana app is open
  async checkSolanaApp(): Promise<boolean> {
    if (!this.#transport) {
      return false
    }

    try {
      // Create fresh Solana app instance
      const transport = await this.getTransport()
      const solanaApp = new AppSolana(transport as Transport)
      // Try to get a simple address to check if app is open
      // Use a standard Solana derivation path
      const testPath = "m/44'/501'/0'"
      await solanaApp.getAddress(testPath, false)
      return true
    } catch (error) {
      Logger.error('Solana app not open or not available', error)
      return false
    }
  }

  // Get Solana address for a specific derivation path
  async getSolanaAddress(derivationPath: string): Promise<{ address: Buffer }> {
    await this.waitForApp(LedgerAppType.SOLANA)
    const transport = await this.getTransport()
    const solanaApp = new AppSolana(transport as Transport)
    return await solanaApp.getAddress(derivationPath, false)
  }

  // Get Solana public keys using SDK function (like extension)
  async getSolanaPublicKeys(
    startIndex: number,
    count: number
  ): Promise<PublicKeyInfo[]> {
    // Create a fresh AppSolana instance for each call (like the SDK does)
    const transport = await this.getTransport()
    const freshSolanaApp = new AppSolana(transport as Transport)
    const publicKeys: PublicKeyInfo[] = []

    try {
      for (let i = startIndex; i < startIndex + count; i++) {
        // Use correct Solana derivation path format
        const derivationPath = getSolanaDerivationPath(i)

        // Simple direct call to get Solana address using fresh instance
        const result = await freshSolanaApp.getAddress(derivationPath, false)
        const publicKey = result.address

        publicKeys.push({
          key: publicKey.toString('hex'),
          derivationPath,
          curve: Curve.ED25519
        })
      }

      return publicKeys
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('6a80')) {
          throw new Error(
            'Wrong app open. Please open the Solana app on your Ledger device.'
          )
        }
        throw new Error(`Failed to get Solana address: ${error.message}`)
      }
      throw new Error('Failed to get Solana address')
    }
  }

  // Alternative method using the SDK function (like the extension does)
  async getSolanaPublicKeysViaSDK(
    startIndex: number,
    _count: number
  ): Promise<PublicKeyInfo[]> {
    try {
      // Use the SDK function directly (like the extension does)
      const publicKey = await getSolanaPublicKeyFromLedger(
        startIndex,
        this.transport as Transport
      )

      const publicKeys: PublicKeyInfo[] = [
        {
          key: publicKey.toString('hex'),
          derivationPath: getSolanaDerivationPath(startIndex),
          curve: Curve.ED25519
        }
      ]

      return publicKeys
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('6a80')) {
          throw new Error(
            'Wrong app open. Please open the Solana app on your Ledger device.'
          )
        }
        throw new Error(
          `Failed to get Solana address via SDK: ${error.message}`
        )
      }
      throw new Error('Failed to get Solana address via SDK')
    }
  }

  // Get Solana addresses from public keys
  async getSolanaAddresses(
    startIndex: number,
    count: number
  ): Promise<AddressInfo[]> {
    Logger.info('Starting getSolanaAddresses')
    try {
      const publicKeys = await this.getSolanaPublicKeys(startIndex, count)
      Logger.info('Got Solana public keys, converting to addresses')

      return publicKeys.map((pk, index) => {
        // Convert public key to Solana address (Base58 encoding)
        const address = bs58.encode(Uint8Array.from(Buffer.from(pk.key, 'hex')))

        return {
          id: `${LedgerAddressType.SOLANA}-${startIndex + index}`,
          type: LedgerAddressType.SOLANA,
          address,
          derivationPath: pk.derivationPath
        }
      })
    } catch (error) {
      Logger.error('Failed in getSolanaAddresses', error)
      throw error
    }
  }

  // Get individual public keys for LedgerLive derivation
  async getPublicKeys(
    startIndex: number,
    count: number
  ): Promise<PublicKeyInfo[]> {
    // Connect to Avalanche app
    await this.waitForApp(LedgerAppType.AVALANCHE)

    // Create Avalanche app instance
    const avalancheApp = new AppAvalanche(this.transport as Transport)

    const publicKeys: PublicKeyInfo[] = []

    try {
      for (let i = startIndex; i < startIndex + count; i++) {
        // EVM public key
        const evmPath = getAddressDerivationPath({
          accountIndex: i,
          vmType: NetworkVMType.EVM
        })
        const evmResponse = await avalancheApp.getAddressAndPubKey(
          evmPath,
          false,
          'avax'
        )
        publicKeys.push({
          key: evmResponse.publicKey.toString('hex'),
          derivationPath: evmPath,
          curve: Curve.SECP256K1
        })

        // AVM public key
        const avmPath = getAddressDerivationPath({
          accountIndex: i,
          vmType: NetworkVMType.AVM
        })
        const avmResponse = await avalancheApp.getAddressAndPubKey(
          avmPath,
          false,
          'avax'
        )
        publicKeys.push({
          key: avmResponse.publicKey.toString('hex'),
          derivationPath: avmPath,
          curve: Curve.SECP256K1
        })

        // Bitcoin public key
        const btcResponse = await avalancheApp.getAddressAndPubKey(
          evmPath,
          false,
          'bc'
        )
        publicKeys.push({
          key: btcResponse.publicKey.toString('hex'),
          derivationPath: evmPath,
          curve: Curve.SECP256K1
        })
      }
    } catch (error) {
      throw new Error(`Failed to get public keys: ${error}`)
    }

    return publicKeys
  }

  // Get all addresses from Avalanche app (EVM, AVM, Bitcoin)
  async getAllAddresses(
    startIndex: number,
    count: number,
    isTestnet: boolean
  ): Promise<AddressInfo[]> {
    // Connect to Avalanche app
    await this.openApp(LedgerAppType.AVALANCHE)
    await this.waitForApp(LedgerAppType.AVALANCHE)

    // Create Avalanche app instance
    const avalancheApp = new AppAvalanche(this.transport as Transport)

    const addresses: AddressInfo[] = []
    const networkHrp = isTestnet ? networkIDs.FujiHRP : networkIDs.MainnetHRP

    try {
      // Derive addresses for each chain
      for (let i = startIndex; i < startIndex + count; i++) {
        // EVM addresses (Ethereum/Avalanche C-Chain) - get from device
        const evmPath = getAddressDerivationPath({
          accountIndex: i,
          vmType: NetworkVMType.EVM
        })
        const evmAddressResponse = await avalancheApp.getETHAddress(
          evmPath,
          false // don't display on device
        )
        addresses.push({
          id: `${LedgerAddressType.EVM}-${i}`,
          type: LedgerAddressType.EVM,
          address: evmAddressResponse.address,
          derivationPath: evmPath
        })

        // Derive the CoreEth (C-chain bech32) address from the Avalanche Ledger
        // app using the EVM derivation path.  The Avalanche app's
        // getAddressAndPubKey returns the bech32-encoded address and the
        // Avalanche app public key at that EVM derivation path — this is NOT
        // the same as bech32-encoding the 0x EVM address bytes. Both Avalanche
        // C-chain and EVM/Ethereum on Ledger use secp256k1; the difference
        // here is in the derivation path (and app behavior), not the
        // underlying curve.
        const evmAvalancheAddressResponse =
          await avalancheApp.getAddressAndPubKey(evmPath, false, networkHrp)
        const coreEthAddress = `C-${stripAddressPrefix(
          evmAvalancheAddressResponse.address
        )}`
        addresses.push({
          id: `${LedgerAddressType.AVALANCHE_CORE_ETH}-${i}`,
          type: LedgerAddressType.AVALANCHE_CORE_ETH,
          address: coreEthAddress,
          derivationPath: evmPath
        })

        // xp addresses - get from device
        const avalancheChainPath = getAddressDerivationPath({
          accountIndex: i,
          vmType: NetworkVMType.AVM
        })
        const avalancheChainAddressResponse =
          await avalancheApp.getAddressAndPubKey(
            avalancheChainPath,
            false,
            networkHrp
          )

        const addressWithoutPrefix = stripAddressPrefix(
          avalancheChainAddressResponse.address
        )

        const xChainAddress = `X-${addressWithoutPrefix}`
        addresses.push({
          id: `${LedgerAddressType.AVALANCHE_X}-${i}`,
          type: LedgerAddressType.AVALANCHE_X,
          address: xChainAddress,
          derivationPath: avalancheChainPath
        })
        const pChainAddress = `P-${addressWithoutPrefix}`

        addresses.push({
          id: `${LedgerAddressType.AVALANCHE_P}-${i}`,
          type: LedgerAddressType.AVALANCHE_P,
          address: pChainAddress,
          derivationPath: avalancheChainPath
        })

        // Bitcoin addresses - derive from the Avalanche app public key at the
        // EVM derivation path (matching the browser extension behavior).
        const btcAddress = getBtcAddressFromPubKey(
          Buffer.from(
            evmAvalancheAddressResponse.publicKey.toString('hex'),
            'hex'
          ),
          isTestnet ? networks.testnet : networks.bitcoin // mainnet or testnet
        )

        addresses.push({
          id: `${LedgerAddressType.BITCOIN}-${i}`,
          type: LedgerAddressType.BITCOIN,
          address: btcAddress,
          derivationPath: evmPath
        })
      }
    } catch (error) {
      throw new Error(`Failed to get addresses: ${error}`)
    }

    return addresses
  }

  // Get all addresses including Solana (requires app switching)
  async getAllAddressesWithSolana(
    startIndex: number,
    count: number,
    isTestnet: boolean
  ): Promise<AddressInfo[]> {
    const addresses: AddressInfo[] = []

    try {
      // Get Avalanche addresses first
      const avalancheAddresses = await this.getAllAddresses(
        startIndex,
        count,
        isTestnet
      )
      addresses.push(...avalancheAddresses)

      // Get Solana addresses
      const solanaAddresses = await this.getSolanaAddresses(startIndex, count)
      addresses.push(...solanaAddresses)

      return addresses
    } catch (error) {
      Logger.error('Failed to get all addresses with Solana', error)
      throw error
    }
  }

  // Disconnect from Ledger device
  async disconnect(): Promise<void> {
    this.isDisconnected = true // Signal pending operations to abort
    if (this.#transport) {
      await this.#transport.close()
      this.#transport = null
      this.currentAppType = LedgerAppType.UNKNOWN
      this.currentAppVersion = ''
      this.stopAppPolling() // Stop polling on disconnect
    }
  }

  // Check if transport is available and connected
  isConnected(): boolean {
    return this.#transport !== null && this.#transport.isConnected
  }

  // Ensure connection is established for a specific device
  async ensureConnection(deviceId: string): Promise<TransportBLE> {
    await this.reconnectIfNeeded(deviceId)
    return this.transport
  }

  // Get the current transport (for compatibility with existing code)
  async getTransport(): Promise<TransportBLE> {
    return this.transport
  }

  // ============================================================================
  // KEY RETRIEVAL METHODS
  // ============================================================================

  /**
   * Get Solana keys from the connected Ledger device.
   * @param accountIndex - BIP44 account index to derive
   * @param signal - Optional AbortSignal to cancel the operation mid-flight
   *                 (e.g. when the user taps "Skip Solana" during onboarding)
   * @returns Array of Solana keys with derivation paths
   */
  async getSolanaKeys(
    accountIndex: number,
    signal?: AbortSignal
  ): Promise<PublicKeyInfo[]> {
    Logger.info('Getting Solana keys with passive app detection')
    await this.openApp(LedgerAppType.SOLANA)

    // Pass the signal to waitForApp so cancellation stops the polling loop
    // before it sends further APDU queries to the Ledger device.
    await this.waitForApp(
      LedgerAppType.SOLANA,
      LEDGER_TIMEOUTS.APP_WAIT_TIMEOUT,
      signal
    )

    // Check if the operation was cancelled while we were waiting for the app.
    // This prevents sending a getAddress APDU after the user has already
    // chosen to skip Solana.
    if (signal?.aborted) {
      throw new Error(LEDGER_ERROR_CODES.USER_CANCELLED)
    }

    // Get address directly from Solana app
    const transport = await this.getTransport()
    const solanaApp = new AppSolana(transport as Transport)

    // Use the SDK's derivation path function (same as other chains)
    const derivationPath = getAddressDerivationPath({
      accountIndex,
      vmType: NetworkVMType.SVM
    })
    // Remove 'm/' prefix if present (Ledger expects path without prefix)
    const ledgerDerivationPath = derivationPath.replace(/^m\//, '')
    const result = await solanaApp.getAddress(ledgerDerivationPath, false)

    // Convert the Buffer to base58 format (Solana address format) - EXACT original logic
    const solanaAddress = bs58.encode(new Uint8Array(result.address))

    Logger.info('Successfully got Solana address', solanaAddress)

    return [
      {
        key: solanaAddress,
        derivationPath,
        curve: Curve.ED25519
      }
    ]
  }

  /**
   * Get Avalanche keys from the connected Ledger device
   * @returns Avalanche keys (addresses for display, xpubs for wallet creation)
   */
  async getAvalancheKeys(
    accountIndex: number,
    isTestnet: boolean,
    derivationPath: LedgerDerivationPathType = LedgerDerivationPathType.BIP44
  ): Promise<AvalancheKey> {
    Logger.info('Getting Avalanche keys')

    // Get addresses for display
    const addresses = await this.getAllAddresses(accountIndex, 1, isTestnet)

    const findAddress = (type: LedgerAddressType): string =>
      addresses.find(addr => addr.type === type)?.address || ''

    const evmAddress = findAddress(LedgerAddressType.EVM)
    const coreEthAddress = findAddress(LedgerAddressType.AVALANCHE_CORE_ETH)
    const avmAddress = findAddress(LedgerAddressType.AVALANCHE_X)
    const pvmAddress = findAddress(LedgerAddressType.AVALANCHE_P)
    const btcAddress = findAddress(LedgerAddressType.BITCOIN)

    const derivationPathType =
      derivationPath === LedgerDerivationPathType.BIP44
        ? 'bip44'
        : 'ledger_live'
    const evmPath = getAddressDerivationPath({
      accountIndex,
      vmType: NetworkVMType.EVM,
      derivationPathType
    })
    const avalanchePath = getAddressDerivationPath({
      accountIndex,
      vmType: NetworkVMType.AVM,
      derivationPathType
    })

    if (derivationPath === LedgerDerivationPathType.BIP44) {
      // BIP44: fetch account-level xpubs and derive address-level public keys
      const extendedKeys = await this.getExtendedPublicKeys(accountIndex)

      const evmXpub = extendedPublicKeyToXpub(
        extendedKeys.evm.key,
        extendedKeys.evm.chainCode
      )

      const avalancheXpub = extendedPublicKeyToXpub(
        extendedKeys.avalanche.key,
        extendedKeys.avalanche.chainCode
      )

      const evmPublicKey = derivePublicKey(evmXpub, 0, 0)?.toString('hex') ?? ''
      const avalanchePublicKey =
        derivePublicKey(avalancheXpub, 0, 0)?.toString('hex') ?? ''

      return {
        addresses: {
          evm: evmAddress,
          avm: avmAddress,
          pvm: pvmAddress,
          coreEth: coreEthAddress,
          btc: btcAddress
        },
        xpubs: {
          evm: evmXpub,
          avalanche: avalancheXpub
        },
        publicKeys: [
          {
            key: evmPublicKey,
            derivationPath: evmPath,
            curve: Curve.SECP256K1
          },
          {
            key: avalanchePublicKey,
            derivationPath: avalanchePath,
            curve: Curve.SECP256K1
          }
        ]
      }
    }

    // Ledger Live: get public keys directly from the device at the account path.
    // The Avalanche app is already open from the getAllAddresses call above.
    const avalancheApp = new AppAvalanche(this.transport as Transport)
    const evmKeyResponse = await avalancheApp.getAddressAndPubKey(
      evmPath,
      false,
      'avax'
    )
    const avalancheKeyResponse = await avalancheApp.getAddressAndPubKey(
      avalanchePath,
      false,
      'avax'
    )

    return {
      addresses: {
        evm: evmAddress,
        avm: avmAddress,
        pvm: pvmAddress,
        coreEth: coreEthAddress,
        btc: btcAddress
      },
      xpubs: {
        evm: '',
        avalanche: ''
      },
      publicKeys: [
        {
          key: evmKeyResponse.publicKey.toString('hex'),
          derivationPath: evmPath,
          curve: Curve.SECP256K1
        },
        {
          key: avalancheKeyResponse.publicKey.toString('hex'),
          derivationPath: avalanchePath,
          curve: Curve.SECP256K1
        }
      ]
    }
  }

  /**
   * Derive Avalanche keys for a range of account indices (0 to count-1).
   * Returns an array where each element is the AvalancheKey for that index,
   * or null if derivation failed for that index.
   * Throws if index 0 fails (index 0 is required).
   */
  async getAvalancheKeysForRange(
    count: number,
    isTestnet: boolean,
    derivationPath: LedgerDerivationPathType = LedgerDerivationPathType.BIP44
  ): Promise<(AvalancheKey | null)[]> {
    const results: (AvalancheKey | null)[] = []

    for (let i = 0; i < count; i++) {
      try {
        const keys = await this.getAvalancheKeys(i, isTestnet, derivationPath)
        results.push(keys)
      } catch (error) {
        if (i === 0) {
          throw error
        }
        Logger.error(
          `Failed to derive Avalanche keys for index ${i}, skipping`,
          error
        )
        results.push(null)
      }
    }

    return results
  }

  /**
   * Derive Solana keys for a range of account indices.
   * Returns an array where each element is the PublicKeyInfo[] for that index,
   * or null if derivation failed.
   *
   * @param count - Number of indices to derive
   * @param startIndex - First account index
   * @param signal - Optional AbortSignal to cancel iteration early
   *                 (e.g. when the user taps "Skip Solana" during onboarding).
   *                 When aborted, the loop stops and returns only the keys
   *                 that were successfully retrieved before cancellation.
   */
  async getSolanaKeysForRange(
    count: number,
    startIndex = 0,
    signal?: AbortSignal
  ): Promise<(PublicKeyInfo[] | null)[]> {
    const results: (PublicKeyInfo[] | null)[] = []

    for (let i = startIndex; i < startIndex + count; i++) {
      // Stop iterating if the caller cancelled the operation.
      // This prevents sending additional APDU requests to the Ledger
      // device after the user chose to skip Solana onboarding.
      if (signal?.aborted) {
        Logger.info(
          `getSolanaKeysForRange: aborting before index ${i} (pre-iteration)`
        )
        break
      }

      try {
        const keys = await this.getSolanaKeys(i, signal)
        results.push(keys)
      } catch (error) {
        // If the abort signal fired during getSolanaKeys, stop the loop
        // instead of logging the cancellation as a derivation failure.
        if (signal?.aborted) {
          Logger.info(
            `getSolanaKeysForRange: aborting at index ${i} (post-error)`
          )
          break
        }

        Logger.error(
          `Failed to derive Solana keys for index ${i}, skipping`,
          error
        )
        results.push(null)
      }
    }

    return results
  }

  /**
   * Fetch only extended public keys for a range of account indices (BIP44).
   * This is much faster than getAvalancheKeysForRange because it skips
   * getAllAddresses() (3 APDU per account) and only fetches xpubs (2 APDU per account).
   * Addresses are derived offline from the xpubs by the caller.
   */
  async getExtendedPublicKeysForRange(
    startIndex: number,
    count: number
  ): Promise<
    Array<{ evm: ExtendedPublicKey; avalanche: ExtendedPublicKey } | null>
  > {
    const results: Array<{
      evm: ExtendedPublicKey
      avalanche: ExtendedPublicKey
    } | null> = []

    for (let i = startIndex; i < startIndex + count; i++) {
      try {
        const xpubs = await this.getExtendedPublicKeys(i)
        results.push(xpubs)
      } catch (error) {
        Logger.error(
          `Failed to get extended public keys for index ${i}, skipping`,
          error
        )
        results.push(null)
      }
    }

    return results
  }

  /**
   * Fetch only public keys for a range of account indices (LedgerLive).
   * Skips getAllAddresses() and fetches 2 public keys per account
   * (EVM path + Avalanche path). Addresses are derived offline by the caller.
   */
  async getPublicKeysForRange(
    startIndex: number,
    count: number
  ): Promise<
    Array<{
      evmPubKey: string
      avalanchePubKey: string
      evmPath: string
      avalanchePath: string
    } | null>
  > {
    await this.waitForApp(LedgerAppType.AVALANCHE)
    const avalancheApp = new AppAvalanche(this.transport as Transport)

    const results: Array<{
      evmPubKey: string
      avalanchePubKey: string
      evmPath: string
      avalanchePath: string
    } | null> = []

    for (let i = startIndex; i < startIndex + count; i++) {
      try {
        const evmPath = getAddressDerivationPath({
          accountIndex: i,
          vmType: NetworkVMType.EVM,
          derivationPathType: 'ledger_live'
        })
        const avalanchePath = getAddressDerivationPath({
          accountIndex: i,
          vmType: NetworkVMType.AVM,
          derivationPathType: 'ledger_live'
        })

        const evmResponse = await avalancheApp.getAddressAndPubKey(
          evmPath,
          false,
          'avax'
        )
        const avalancheResponse = await avalancheApp.getAddressAndPubKey(
          avalanchePath,
          false,
          'avax'
        )

        results.push({
          evmPubKey: evmResponse.publicKey.toString('hex'),
          avalanchePubKey: avalancheResponse.publicKey.toString('hex'),
          evmPath,
          avalanchePath
        })
      } catch (error) {
        Logger.error(
          `Failed to get public keys for LedgerLive index ${i}, skipping`,
          error
        )
        results.push(null)
      }
    }

    return results
  }

  // Helper to build the “open app” APDU for a given app name
  buildOpenAppApdu(appName: string): Buffer {
    const cla = 0xe0
    const ins = 0xd8
    const p1 = 0x00
    const p2 = 0x00

    const nameBytes = Buffer.from(appName, 'ascii')
    const lc = nameBytes.length // Lc = length of data

    const apdu = Buffer.alloc(5 + lc)
    apdu[0] = cla
    apdu[1] = ins
    apdu[2] = p1
    apdu[3] = p2
    apdu[4] = lc

    nameBytes.copy(apdu as unknown as Uint8Array, 5)
    return apdu
  }

  // Attempt to open a specific app on the Ledger device
  // Best-effort, does not guarantee success
  async openApp(app: LedgerAppType): Promise<void> {
    // Skip if the app is already open — sending the open-app APDU while inside
    // a running app forces the device to exit and restart into the new app,
    // causing a BLE disconnect that Android does not reliably recover from.
    if (this.currentAppType === app) {
      Logger.info(`${app} app is already open, skipping open request`)
      return
    }

    try {
      const apdu = this.buildOpenAppApdu(app)
      const response = await this.transport.exchange(apdu)

      // Last 2 bytes are the status word (SW1, SW2), the rest is data.
      const sw1 = response[response.length - 2]
      const sw2 = response[response.length - 1]

      // @ts-ignore
      // eslint-disable-next-line no-bitwise
      const statusCode = (sw1 << 8) | sw2

      if (statusCode === LedgerReturnCode.SUCCESS) {
        Logger.info(
          `Successfully opened ${app} app on Ledger device using APDU`
        )
      } else {
        const swHex = statusCode.toString(16).padStart(4, '0')
        Logger.info(`Unexpected status word: 0x${swHex}`)
      }

      // Optional: use response.slice(0, -2) to read any data part.
    } catch (error) {
      // Do not throw error, just log it, we can't reliably force-switch apps on a Ledger
      // from one third‑party app to another, so this is just a best-effort attempt.
      Logger.info(`Failed to open ${app} app:`, error)
    }
  }
}

export default new LedgerService()
