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
  getLedgerAppInfo
} from '@avalabs/core-wallets-sdk'
import { networks } from 'bitcoinjs-lib'
import { getAddress } from 'ethers'
import { networkIDs } from '@avalabs/avalanchejs'
import Logger from 'utils/Logger'
import bs58 from 'bs58'
import { DERIVATION_PATHS, LEDGER_TIMEOUTS } from 'new/features/ledger/consts'
import { isBitcoinCompatibleApp } from 'new/features/ledger/utils'
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
  isLedgerConnectionFailed,
  LEDGER_SCAN_FAILED_ALREADY_CONNECTED_MESSAGE,
  LEDGER_SCAN_FAILED_TITLE,
  ledgerBluetoothErrors,
  showBluetoothErrorAlert
} from './LedgerBluetoothError'

class LedgerService {
  #transport: TransportBLE | null = null
  private _currentAppType: LedgerAppType = LedgerAppType.UNKNOWN
  private currentAppVersion = ''

  private get currentAppType(): LedgerAppType {
    return this._currentAppType
  }

  private set currentAppType(value: LedgerAppType) {
    this._currentAppType = value

    // When resetting app type (e.g. at the start of a new connect()),
    // also clear the cached version to avoid using stale data.
    if (value === LedgerAppType.UNKNOWN) {
      this.currentAppVersion = ''
    }
  }

  private appPollingInterval: number | null = null
  private disconnectHandler: (() => void) | null = null
  private appPollingPaused = false

  // Reconnection state & policy
  private connectedDeviceId: string | null = null
  private isAttemptingReconnect = false
  private autoReconnectDisabled = false
  // Mutex: serializes all connect() calls so concurrent callers
  // (manual reconnect, auto-reconnect, onboarding) don't race on
  // TransportBLE.open().
  private connectInFlight: Promise<void> | null = null
  private connectInFlightDeviceId: string | null = null
  private connectionStateListeners: Set<(connected: boolean) => void> =
    new Set()

  // Device scanning state
  private scanSubscription: { unsubscribe: () => void } | null = null
  private deviceListeners: Set<(devices: LedgerDevice[]) => void> = new Set()
  private currentDevices: LedgerDevice[] = []
  private isScanning = false

  // Wrap transport's exchange method to automatically handle busy state
  private wrapTransportExchange(): void {
    if (!this.#transport) return
    const originalExchange = this.#transport.exchange.bind(this.#transport)

    // Replace exchange method with wrapped version
    this.#transport.exchange = async (apdu: Buffer): Promise<Buffer> => {
      // If transport is busy, wait for the in-flight exchange to complete
      if (this.#transport?.exchangeBusyPromise) {
        await this.#transport.exchangeBusyPromise
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
          if (this.#transport?.exchangeBusyPromise) {
            await this.#transport.exchangeBusyPromise
          } else {
            await new Promise(res =>
              setTimeout(res, LEDGER_TIMEOUTS.REQUEST_DELAY)
            )
          }
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

  // Serializing wrapper: ensures only one TransportBLE.open() is in
  // flight at a time. Same-device callers share the in-flight promise;
  // different-device callers are rejected so they don't silently get
  // connected to the wrong device.
  async connect(deviceId: string): Promise<void> {
    if (this.connectInFlight) {
      if (this.connectInFlightDeviceId === deviceId) {
        Logger.info('connect() already in flight — joining existing attempt')
        return this.connectInFlight
      }
      throw new Error(
        `Connection to ${this.connectInFlightDeviceId} already in progress`
      )
    }

    this.connectInFlightDeviceId = deviceId
    this.connectInFlight = this.connectInternal(deviceId).finally(() => {
      this.connectInFlight = null
      this.connectInFlightDeviceId = null
    })

    return this.connectInFlight
  }

  // Connect to Ledger device (transport only, no apps)
  private async connectInternal(deviceId: string): Promise<void> {
    try {
      Logger.info('Starting BLE connection attempt with deviceId:', deviceId)
      await this.assertBluetoothAvailable()
      // Only reset auto-reconnect policy on user-initiated connects,
      // not when called from the auto-reconnect loop — otherwise an
      // in-flight reconnect can undo a forgetDevice() call.
      if (!this.isAttemptingReconnect) {
        this.autoReconnectDisabled = false
      }
      this.connectedDeviceId = deviceId // Store for auto-reconnect

      // Clean up any previous transport's disconnect listener before
      // opening a new one — otherwise a late-firing event from the old
      // transport can null out the new #transport.
      if (this.#transport && this.disconnectHandler) {
        this.#transport.off('disconnect', this.disconnectHandler)
        this.disconnectHandler = null
      }

      await TransportBLE.disconnectDevice(deviceId).catch(Logger.error)

      this.#transport = await TransportBLE.open(
        deviceId,
        LEDGER_TIMEOUTS.CONNECTION_TIMEOUT
      )
      Logger.info('BLE transport connected successfully')

      // Listen for unexpected BLE disconnects (e.g. Ledger auto-sleep)
      // so we can attempt auto-reconnect instead of silently going stale.
      // Capture the transport instance so stale events from a previous
      // transport are ignored even if #transport has been replaced.
      const currentTransport = this.#transport
      this.disconnectHandler = (): void => {
        if (this.#transport !== currentTransport) {
          Logger.info('Ignoring disconnect from stale transport')
          return
        }
        Logger.info('Transport disconnect event received')
        this.handleTransportDisconnect()
      }
      this.#transport.on('disconnect', this.disconnectHandler)

      // Wrap the transport's exchange method to automatically handle busy state
      this.wrapTransportExchange()

      this.currentAppType = LedgerAppType.UNKNOWN

      // Notify listeners that the connection is up
      this.notifyConnectionStateListeners(true)

      this.startAppPolling()

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
      if (isLedgerBluetoothError(error) || isLedgerConnectionFailed(error)) {
        throw error
      }
      throw new Error(
        `Failed to connect to Ledger: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  // Handle an unexpected BLE transport disconnect (e.g. Ledger auto-sleep).
  // Cleans up stale state and funnels reconnection through scheduleReconnect.
  private handleTransportDisconnect(): void {
    // If #transport is already null, disconnect() already ran and cleaned
    // up — this is a late-firing event on the old transport object.
    // Skip entirely to avoid spurious reconnects.
    if (!this.#transport) return

    // Detach the listener before nulling so the transport object doesn't
    // hold a reference to a stale handler.
    if (this.disconnectHandler) {
      this.#transport.off('disconnect', this.disconnectHandler)
      this.disconnectHandler = null
    }
    this.#transport = null
    this.currentAppType = LedgerAppType.UNKNOWN
    this.stopAppPolling()
    this.notifyConnectionStateListeners(false)
    this.scheduleReconnect('transport-disconnect')
  }

  // Centralized reconnect entry — all reconnection triggers funnel here
  // to prevent race conditions and redundant loops.
  scheduleReconnect(reason: string): void {
    if (
      this.autoReconnectDisabled ||
      this.isAttemptingReconnect ||
      !this.connectedDeviceId
    ) {
      return
    }
    Logger.info(`Scheduling Ledger reconnect: ${reason}`)
    this.attemptReconnect().catch(Logger.error)
  }

  // Returns true when the reconnect loop should bail out — either because
  // auto-reconnect was disabled (e.g. forgetDevice during wallet
  // switch) or because a different device connected in the meantime.
  private shouldCancelReconnect(originalDeviceId: string): boolean {
    if (this.autoReconnectDisabled) {
      Logger.info('Reconnect cancelled: auto-reconnect disabled')
      return true
    }
    if (this.connectedDeviceId !== originalDeviceId) {
      Logger.info(
        'Reconnect cancelled: connectedDeviceId changed ' +
          `(was ${originalDeviceId}, now ${this.connectedDeviceId})`
      )
      return true
    }
    return false
  }

  // Auto-reconnect with exponential backoff. Gives the Ledger device
  // time to finish waking from sleep before each retry.
  private async attemptReconnect(): Promise<void> {
    if (this.isAttemptingReconnect || !this.connectedDeviceId) return

    this.isAttemptingReconnect = true
    const deviceId = this.connectedDeviceId

    try {
      for (
        let attempt = 1;
        attempt <= LEDGER_TIMEOUTS.RECONNECT_MAX_RETRIES;
        attempt++
      ) {
        if (this.shouldCancelReconnect(deviceId)) return

        try {
          Logger.info(
            `Reconnection attempt ${attempt}/${LEDGER_TIMEOUTS.RECONNECT_MAX_RETRIES} for device ${deviceId}`
          )
          await this.connect(deviceId)

          // If forgetDevice() was called while connect() was
          // in flight, tear down the connection we just established.
          if (this.shouldCancelReconnect(deviceId)) {
            await this.disconnect({ manual: true })
            return
          }

          Logger.info(`Reconnection succeeded on attempt ${attempt}`)
          return
        } catch (error) {
          Logger.error(
            `Reconnection attempt ${attempt}/${LEDGER_TIMEOUTS.RECONNECT_MAX_RETRIES} failed:`,
            error
          )
          if (attempt >= LEDGER_TIMEOUTS.RECONNECT_MAX_RETRIES) continue

          const delay =
            LEDGER_TIMEOUTS.RECONNECT_BASE_DELAY * 2 ** (attempt - 1)
          await new Promise(res => setTimeout(res, delay))

          // Re-check after the delay — forgetDevice() may have
          // been called while we were sleeping.
          if (this.shouldCancelReconnect(deviceId)) return
        }
      }
      Logger.error('All reconnection attempts failed')
      this.notifyConnectionStateListeners(false)
    } finally {
      this.isAttemptingReconnect = false
    }
  }

  // Allow UI components to subscribe to connection state changes so
  // they can react immediately instead of waiting for the next poll.
  addConnectionStateListener(
    callback: (connected: boolean) => void
  ): () => void {
    this.connectionStateListeners.add(callback)
    return () => this.connectionStateListeners.delete(callback)
  }

  private notifyConnectionStateListeners(connected: boolean): void {
    this.connectionStateListeners.forEach(callback => {
      try {
        callback(connected)
      } catch (error) {
        Logger.error('Error in connection state listener:', error)
      }
    })
  }

  // Start passive app detection polling
  private startAppPolling(): void {
    if (this.appPollingInterval !== null) {
      return
    }

    this.appPollingInterval = setInterval(async () => {
      try {
        if (!this.#transport || !this.#transport.isConnected) {
          this.stopAppPolling()

          // Safety net: if the transport disconnect event did not fire,
          // funnel through the central reconnect gateway.
          this.scheduleReconnect('polling-detected-disconnect')
          return
        }

        if (this.appPollingPaused) return

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
    this.appPollingPaused = false
  }

  pauseAppPolling(): void {
    this.appPollingPaused = true
    Logger.info('App polling paused for signing')
  }

  resumeAppPolling(): void {
    this.appPollingPaused = false
    Logger.info('App polling resumed after signing')
  }

  // Handle scan errors (matching original implementation)
  private handleScanError(
    error: Error,
    onScanError: (error: { title: string; message: string }) => void
  ): void {
    Logger.error('Scan error:', error)
    this.stopDeviceScanning()

    if (isLedgerBluetoothError(error)) {
      showBluetoothErrorAlert(error)
      return
    }
    onScanError({
      title: 'Scan Error',
      message: `Failed to scan for devices: ${error.message}`
    })
  }

  // Device scanning methods (matching original implementation)
  async startDeviceScanning(
    onScanError: (error: { title: string; message: string }) => void
  ): Promise<void> {
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
          this.handleScanError(error, onScanError)
        },

        complete: () => {
          Logger.info('Device scanning completed')
        }
      })

      // Auto-stop scanning after timeout (matching original)
      setTimeout(() => {
        Logger.info('Scan timeout reached, stopping...')
        this.stopDeviceScanning()

        if (this.currentDevices.length === 0) {
          onScanError({
            title: LEDGER_SCAN_FAILED_TITLE,
            message: LEDGER_SCAN_FAILED_ALREADY_CONNECTED_MESSAGE
          })
        }
      }, LEDGER_TIMEOUTS.SCAN_TIMEOUT)
    } catch (error) {
      Logger.error('Failed to start device scanning:', error)
      this.isScanning = false
      this.handleScanError(error as Error, onScanError)
    }
  }

  stopDeviceScanning(): void {
    if (!this.isScanning) return

    Logger.info('Stopping device scanning...')

    if (this.scanSubscription) {
      this.scanSubscription.unsubscribe()
      this.scanSubscription = null
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

  private async getCurrentAppInfo(): Promise<AppInfo> {
    return this.withTransport(transport => getLedgerAppInfo(transport))
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

  async checkApp(appType: LedgerAppType): Promise<boolean> {
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
    if (signal?.aborted) {
      throw new Error(LEDGER_ERROR_CODES.USER_CANCELLED)
    }

    // Always verify device state with a real APDU check — cached
    // currentAppType may be stale after reconnects or app changes.
    if (await this.checkApp(appType)) {
      return
    }

    return this.pollForApp(appType, timeoutMs, signal)
  }

  // Poll the Ledger device until the requested app is open, the timeout
  // expires, or the operation is cancelled via signal/disconnect.
  private async pollForApp(
    appType: LedgerAppType,
    timeoutMs: number,
    signal?: AbortSignal
  ): Promise<void> {
    const startTime = Date.now()
    Logger.info(`Waiting for ${appType} app (timeout: ${timeoutMs}ms)...`)

    // Abort-aware delay: resolves after APP_CHECK_DELAY or rejects
    // immediately when the signal fires — so cancellation doesn't have
    // to wait for the next polling tick.
    const delay = (): Promise<void> =>
      new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          signal?.removeEventListener('abort', onAbort)
          resolve()
        }, LEDGER_TIMEOUTS.APP_CHECK_DELAY)
        const onAbort = (): void => {
          clearTimeout(timer)
          reject(new Error(LEDGER_ERROR_CODES.USER_CANCELLED))
        }
        signal?.addEventListener('abort', onAbort, { once: true })
      })

    while (Date.now() - startTime < timeoutMs) {
      if (signal?.aborted) {
        throw new Error(LEDGER_ERROR_CODES.USER_CANCELLED)
      }

      if (!this.#transport?.isConnected) {
        throw new Error(LEDGER_ERROR_CODES.TRANSPORT_INTERFACE_NOT_AVAILABLE)
      }

      if (await this.checkApp(appType)) {
        return
      }

      // Re-check after checkApp — the signal may have fired while the
      // APDU round-trip was in flight. Without this, delay() would wait
      // the full timer because addEventListener on an already-aborted
      // signal is a no-op per DOM spec.
      if (signal?.aborted) {
        throw new Error(LEDGER_ERROR_CODES.USER_CANCELLED)
      }

      await delay()
    }

    throw new Error(
      `Timeout waiting for ${appType} app. Please open the ${appType} app on your Ledger device.`
    )
  }

  // Gatekeeper — wraps all SDK calls with a fast-fail transport check.
  // If the transport is gone, the caller finds out immediately instead
  // of hanging on a background retry.
  private async withTransport<T>(
    operation: (t: Transport) => Promise<T>
  ): Promise<T> {
    if (!this.#transport?.isConnected) {
      throw new Error(LEDGER_ERROR_CODES.TRANSPORT_INTERFACE_NOT_AVAILABLE)
    }
    return operation(this.#transport as unknown as Transport)
  }

  /**
   * Get the correct EVM derivation path for a given account index.
   *
   * BIP44:      m/44'/60'/0'/0/{accountIndex}  (shared account, varying address index)
   * LedgerLive: m/44'/60'/{accountIndex}'/0/0  (per-account, fixed address index)
   */
  private getEvmDerivationPath(
    accountIndex: number,
    derivationPathType?: LedgerDerivationPathType
  ): string {
    const sdkDerivationPathType =
      derivationPathType === LedgerDerivationPathType.LedgerLive
        ? 'ledger_live'
        : 'bip44'
    return getAddressDerivationPath({
      accountIndex,
      vmType: NetworkVMType.EVM,
      derivationPathType: sdkDerivationPathType
    })
  }

  // Get extended public keys for BIP44 derivation
  async getExtendedPublicKeys(
    accountIndex: number,
    derivationPathType?: LedgerDerivationPathType
  ): Promise<{
    evm: ExtendedPublicKey
    avalanche: ExtendedPublicKey
  }> {
    await this.ensureAppReady(LedgerAppType.AVALANCHE)

    return this.withTransport(async transport => {
      const avalancheApp = new AppAvalanche(transport)

      const evmPath =
        derivationPathType === LedgerDerivationPathType.BIP44
          ? DERIVATION_PATHS.EXTENDED.EVM(0)
          : getAddressDerivationPath({
              accountIndex,
              vmType: NetworkVMType.EVM
            }).replace('/0/0', '')

      const evmXpubResponse = await avalancheApp.getExtendedPubKey(
        evmPath,
        false
      )

      if (evmXpubResponse.returnCode !== LedgerReturnCode.SUCCESS) {
        throw new Error(
          `EVM extended public key error: ${
            evmXpubResponse.errorMessage || 'Unknown error'
          }`
        )
      }

      const avalanchePath = getAddressDerivationPath({
        accountIndex,
        vmType: NetworkVMType.AVM
      }).replace('/0/0', '')

      const avalancheXpubResponse = await avalancheApp.getExtendedPubKey(
        avalanchePath,
        false
      )

      if (avalancheXpubResponse.returnCode !== LedgerReturnCode.SUCCESS) {
        throw new Error(
          `Avalanche extended public key error: ${
            avalancheXpubResponse.errorMessage || 'Unknown error'
          }`
        )
      }

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
    })
  }

  // Get all addresses from Avalanche app (EVM, AVM, Bitcoin)
  async getAllAddresses(
    startIndex: number,
    count: number,
    isTestnet: boolean,
    derivationPathType?: LedgerDerivationPathType
  ): Promise<AddressInfo[]> {
    await this.ensureAppReady(LedgerAppType.AVALANCHE)

    return this.withTransport(async transport => {
      const avalancheApp = new AppAvalanche(transport)
      const addresses: AddressInfo[] = []
      const networkHrp = isTestnet ? networkIDs.FujiHRP : networkIDs.MainnetHRP

      for (let i = startIndex; i < startIndex + count; i++) {
        // EVM addresses (Ethereum/Avalanche C-Chain) - get from device
        const evmPath = this.getEvmDerivationPath(i, derivationPathType)
        const evmAddressResponse = await avalancheApp.getETHAddress(
          evmPath,
          false // don't display on device
        )
        addresses.push({
          id: `${LedgerAddressType.EVM}-${i}`,
          type: LedgerAddressType.EVM,
          address: getAddress(evmAddressResponse.address),
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
          vmType: NetworkVMType.AVM,
          derivationPathType:
            derivationPathType === LedgerDerivationPathType.LedgerLive
              ? 'ledger_live'
              : 'bip44'
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

        addresses.push({
          id: `${LedgerAddressType.AVALANCHE_X}-${i}`,
          type: LedgerAddressType.AVALANCHE_X,
          address: `X-${addressWithoutPrefix}`,
          derivationPath: avalancheChainPath
        })

        addresses.push({
          id: `${LedgerAddressType.AVALANCHE_P}-${i}`,
          type: LedgerAddressType.AVALANCHE_P,
          address: `P-${addressWithoutPrefix}`,
          derivationPath: avalancheChainPath
        })

        // Bitcoin addresses - derive from the Avalanche app public key at the
        // EVM derivation path (matching the browser extension behavior).
        const btcAddress = getBtcAddressFromPubKey(
          Buffer.from(
            evmAvalancheAddressResponse.publicKey.toString('hex'),
            'hex'
          ),
          isTestnet ? networks.testnet : networks.bitcoin
        )

        addresses.push({
          id: `${LedgerAddressType.BITCOIN}-${i}`,
          type: LedgerAddressType.BITCOIN,
          address: btcAddress,
          derivationPath: evmPath
        })
      }

      return addresses
    })
  }

  // Disconnect from Ledger device.
  // connectedDeviceId is intentionally preserved so that the foreground
  // AppState handler (and manual reconnect) can reconnect to the same
  // device without requiring a fresh scan.
  //
  // manual = true  → user-initiated unpair / exit → suppress auto-reconnect
  // manual = false → lifecycle sleep (backgrounding) → allow auto-reconnect
  async disconnect({ manual = true } = {}): Promise<void> {
    this.autoReconnectDisabled = manual
    this.stopAppPolling()

    if (this.#transport) {
      // Capture transport before nulling so we can still call close() below.
      const transport = this.#transport
      const deviceId = transport.id
      // Remove disconnect listener before nulling transport so the
      // handler doesn't fire during teardown and trigger a spurious
      // reconnect attempt.
      if (this.disconnectHandler) {
        transport.off('disconnect', this.disconnectHandler)
        this.disconnectHandler = null
      }
      this.#transport = null
      this.currentAppType = LedgerAppType.UNKNOWN
      this.notifyConnectionStateListeners(false)
      // disconnectDevice() immediately drops the physical BLE link so other
      // devices can connect without the ~5 s delay that transport.close() imposes.
      try {
        await TransportBLE.disconnectDevice(deviceId)
      } catch (error) {
        Logger.error('Failed to disconnect Ledger BLE device', error)
      }
      // Fire-and-forget close() for SDK-side cleanup (cancels pending exchanges,
      // removes internal BLE listeners, resets transport state). The BLE link is
      // already down at this point so the delay inside close() has no effect.
      transport.close().catch(Logger.error)
    }
  }

  // Forget the device: clear the remembered device ID and suppress
  // auto-reconnect. Call when the user switches away from a Ledger wallet.
  forgetDevice(): void {
    this.connectedDeviceId = null
    this.autoReconnectDisabled = true
  }

  // Check if transport is available and connected
  isConnected(): boolean {
    return this.#transport !== null && this.#transport.isConnected
  }

  // Get the current transport with fast-fail.
  // Throws immediately if the transport is not available — callers should
  // show a reconnect prompt rather than silently retrying.
  getTransport(): TransportBLE {
    if (!this.#transport?.isConnected) {
      throw new Error(LEDGER_ERROR_CODES.TRANSPORT_INTERFACE_NOT_AVAILABLE)
    }
    return this.#transport
  }

  // Always-verify app readiness: skip the openApp APDU if the cached state
  // matches (minimizing BLE traffic) but always run waitForApp to verify
  // device readiness before sending the payload.
  private async ensureAppReady(
    appType: LedgerAppType,
    signal?: AbortSignal
  ): Promise<void> {
    if (!this.isAppCompatible(this.currentAppType, appType)) {
      await this.openApp(appType)
    }
    await this.waitForApp(appType, LEDGER_TIMEOUTS.APP_WAIT_TIMEOUT, signal)
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
    await this.ensureAppReady(LedgerAppType.SOLANA, signal)

    // Check if the operation was cancelled while we were waiting for the app.
    // This prevents sending a getAddress APDU after the user has already
    // chosen to skip Solana.
    if (signal?.aborted) {
      throw new Error(LEDGER_ERROR_CODES.USER_CANCELLED)
    }

    return this.withTransport(async transport => {
      const solanaApp = new AppSolana(transport)

      // Use the SDK's derivation path function (same as other chains)
      const derivationPath = getAddressDerivationPath({
        accountIndex,
        vmType: NetworkVMType.SVM
      })
      // Remove 'm/' prefix if present (Ledger expects path without prefix)
      const ledgerDerivationPath = derivationPath.replace(/^m\//, '')
      const result = await solanaApp.getAddress(ledgerDerivationPath, false)

      // Convert the Buffer to base58 format (Solana address format)
      const solanaAddress = bs58.encode(new Uint8Array(result.address))

      Logger.info('Successfully got Solana address', solanaAddress)

      return [
        {
          key: solanaAddress,
          derivationPath,
          curve: Curve.ED25519
        }
      ]
    })
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
    const addresses = await this.getAllAddresses(
      accountIndex,
      1,
      isTestnet,
      derivationPath
    )

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
      const extendedKeys = await this.getExtendedPublicKeys(
        accountIndex,
        derivationPath
      )

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
    return this.withTransport(async transport => {
      const avalancheApp = new AppAvalanche(transport)
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
    })
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
        const xpubs = await this.getExtendedPublicKeys(
          i,
          LedgerDerivationPathType.BIP44
        )
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
    await this.ensureAppReady(LedgerAppType.AVALANCHE)

    return this.withTransport(async transport => {
      const avalancheApp = new AppAvalanche(transport)

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
    })
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

    // Always quit the current app before opening a new one. Opening an app
    // while another third-party app is running triggers a BLE disconnect on
    // some devices; quitting first avoids this. We quit unconditionally
    // because currentAppType can be UNKNOWN even when an app is running
    // (e.g. after a reconnect where the initial app-info check failed).
    // Sending the quit APDU from the dashboard is a harmless no-op.
    if (this.isConnected()) {
      await this.quitLedgerApp()
      // Brief delay to let the device settle on the dashboard
      await new Promise(res => setTimeout(res, LEDGER_TIMEOUTS.REQUEST_DELAY))
    }

    try {
      const apdu = this.buildOpenAppApdu(app)
      const response = await this.withTransport(transport =>
        transport.exchange(apdu)
      )

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

  /**
   * Quit the current ledger app and return to the dashboard.
   * @see https://developers.ledger.com/docs/transport/open-close-info-on-apps/#quit-application
   */
  async quitLedgerApp(): Promise<void> {
    try {
      await this.withTransport(transport =>
        transport.send(0xb0, 0xa7, 0x00, 0x00)
      )
      this.currentAppType = LedgerAppType.UNKNOWN
      Logger.info('Successfully quit current Ledger app')
    } catch (error) {
      Logger.info('Failed to quit Ledger app:', error)
    }
  }
}

export default new LedgerService()
