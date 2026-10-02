import { NetworkVMType } from '@avalabs/core-chains-sdk'
import * as Sentry from '@sentry/react-native'
import {
  getAddressDerivationPath,
  handleLedgerError
} from 'services/wallet/utils'
import { getBtcAddressFromPubKey } from '@avalabs/core-wallets-sdk'
import { networks } from 'bitcoinjs-lib'
import { getAddress } from 'ethers'
import { networkIDs } from '@avalabs/avalanchejs'
import Logger from 'utils/Logger'
import { DERIVATION_PATHS, LEDGER_TIMEOUTS } from 'new/features/ledger/consts'
import { isBitcoinCompatibleApp } from 'new/features/ledger/utils'
import { Curve } from 'utils/publicKeys'
import { derivePublicKey, extendedPublicKeyToXpub } from 'utils/bip32'
import { BluetoothState } from 'services/bluetooth/types'
import BluetoothService from 'services/bluetooth/BluetoothService'
import {
  CloseAppCommand,
  DeviceManagementKit,
  DeviceManagementKitBuilder,
  DeviceStatus,
  GetAppAndVersionCommand,
  isSuccessCommandResult,
  OpenAppCommand,
  type DeviceSessionId,
  type DeviceSessionState,
  type DiscoveredDevice
} from '@ledgerhq/device-management-kit'
import {
  RNBleTransportFactory,
  rnBleTransportIdentifier
} from '@ledgerhq/device-transport-kit-react-native-ble'
import AvalancheApp from '@avalabs/hw-app-avalanche'
import { SignerSolanaBuilder } from '@ledgerhq/device-signer-kit-solana'
import { filter, firstValueFrom, map, timeout, type Subscription } from 'rxjs'
import {
  assertDeviceBech32Address,
  assertDeviceEvmAddress,
  assertDevicePublicKey,
  assertDeviceSolanaBase58Address
} from './validateDeviceAddress'
import {
  AddressInfo,
  LedgerAddressType,
  ExtendedPublicKey,
  PublicKeyInfo,
  LedgerAppType,
  LedgerReturnCode,
  AppInfo,
  LedgerDevice,
  LedgerSession,
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
import { DmkApduTransport } from './DmkApduTransport'
import { runDeviceAction } from './runDeviceAction'
import { describeDmkError } from './describeDmkError'

class LedgerService {
  #dmk: DeviceManagementKit | null = null
  #sessionId: DeviceSessionId | null = null
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

  private sessionStateSubscription: Subscription | null = null
  private appPollingInterval: ReturnType<typeof setInterval> | null = null
  private appPollInFlight = false
  private openAppInFlight: Map<LedgerAppType, Promise<void>> = new Map()
  // Mirrors the last deviceStatus we told listeners about, so a session-state
  // emission that doesn't change connectedness doesn't re-notify.
  private isDeviceReachable = false

  // Reconnection state & policy
  private connectedDeviceId: string | null = null
  private autoReconnectDisabled = false
  // Mutex: serializes all connect() calls so concurrent callers
  // (manual reconnect, auto-reconnect, onboarding) don't race on
  // dmk.connect().
  private connectInFlight: Promise<void> | null = null
  private connectInFlightDeviceId: string | null = null
  private connectionStateListeners: Set<(connected: boolean) => void> =
    new Set()

  // Device scanning state
  private scanSubscription: Subscription | null = null
  private deviceListeners: Set<(devices: LedgerDevice[]) => void> = new Set()
  private currentDevices: LedgerDevice[] = []
  private isScanning = false
  // dmk.connect() needs the DiscoveredDevice object, not just its id, so every
  // device we see during discovery is kept here for connect() to look up.
  private discoveredDevices: Map<string, DiscoveredDevice> = new Map()

  private get dmk(): DeviceManagementKit {
    if (!this.#dmk) {
      this.#dmk = new DeviceManagementKitBuilder()
        .addTransport(RNBleTransportFactory)
        .build()
    }
    return this.#dmk
  }

  // Session-global Sentry tags so any later Ledger error (e.g. a
  // validateDeviceAddress capture) carries the app that produced it —
  // distinguishes "this Avalanche app version returns empty addresses" from
  // transport-layer frame corruption (CP-14964).
  private recordLedgerAppSentryTags(
    appType: LedgerAppType,
    version: string
  ): void {
    try {
      const scope = Sentry.getGlobalScope()
      scope.setTag('ledgerAppType', appType)
      scope.setTag('ledgerAppVersion', version)
    } catch {
      // Tagging must never break the connect/poll flow.
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

  // Same-device callers share the in-flight promise; different-device callers
  // are rejected so they don't silently get connected to the wrong device.
  async connect(deviceId: string): Promise<void> {
    // Already live on this device — do nothing. Several callers drive connect
    // (the setup context, useLedgerBLEConnection's reconnect effect), and a
    // second call lands after the first has resolved, so the in-flight mutex
    // below does not catch it. Reconnecting would tear down a working session,
    // and the teardown races the new connect: the device drops and the fresh
    // session is born dead.
    if (this.connectedDeviceId === deviceId && this.isConnected()) {
      Logger.info('connect() ignored — already connected to this device')
      return
    }

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
    // Bounded so the mutex always clears: an unbounded connectInternal would
    // make every later caller join a promise that never settles.
    this.connectInFlight = this.withTimeout(
      this.connectInternal(deviceId),
      LEDGER_TIMEOUTS.CONNECTION_TIMEOUT,
      'connect'
    ).finally(() => {
      this.connectInFlight = null
      this.connectInFlightDeviceId = null
    })

    return this.connectInFlight
  }

  // Connect to Ledger device (transport only, no apps)
  private async connectInternal(deviceId: string): Promise<void> {
    try {
      await this.assertBluetoothAvailable()
      this.autoReconnectDisabled = false
      this.connectedDeviceId = deviceId // Store for auto-reconnect

      // Tear down any previous session before opening a new one, so a
      // late-firing state emission from the old session can't clobber the
      // new one's app/connection state.
      await this.teardownSession()

      const device = await this.resolveDiscoveredDevice(deviceId)

      this.#sessionId = await this.dmk.connect({ device })

      this.currentAppType = LedgerAppType.UNKNOWN
      this.isDeviceReachable = true

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
        this.recordLedgerAppSentryTags(detectedAppType, testAppInfo.version)
      } catch {
        // Best-effort: refreshAppInfo's poll picks the app type up shortly.
        Logger.info('Immediate app-info probe failed, relying on polling')
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

  /**
   * dmk.connect() takes a DiscoveredDevice, but our callers (and the persisted
   * wallet) only hold a device id. Devices seen during a user-initiated scan are
   * already cached; otherwise — reconnecting after a restart or a
   * background/foreground cycle, where no scan preceded — run a bounded
   * discovery to find this one.
   */
  private async resolveDiscoveredDevice(
    deviceId: string
  ): Promise<DiscoveredDevice> {
    const cached = this.discoveredDevices.get(deviceId)
    if (cached) return cached

    Logger.info(`Device ${deviceId} not in scan cache — discovering`)

    try {
      return await firstValueFrom(
        this.dmk
          .listenToAvailableDevices({ transport: rnBleTransportIdentifier })
          .pipe(
            map(devices => {
              devices.forEach(d => this.discoveredDevices.set(d.id, d))
              return devices.find(d => d.id === deviceId)
            }),
            filter((found): found is DiscoveredDevice => found !== undefined),
            timeout(LEDGER_TIMEOUTS.CONNECTION_TIMEOUT)
          )
      )
    } finally {
      // Only stop the scan we started here; a user-initiated scan owns its own
      // lifecycle and must keep running.
      if (!this.isScanning) {
        await this.dmk.stopDiscovering().catch(Logger.error)
      }
    }
  }

  /**
   * The session is deliberately kept across a NOT_CONNECTED emission: the BLE
   * transport retries the link itself, and a successful retry brings this same
   * session back to CONNECTED. Only an explicit disconnect() tears it down.
   */
  private handleSessionState(state: DeviceSessionState): void {
    const reachable = state.deviceStatus !== DeviceStatus.NOT_CONNECTED

    if (reachable !== this.isDeviceReachable) {
      this.isDeviceReachable = reachable
      Logger.info(
        `Ledger device ${reachable ? 'reachable' : 'unreachable'} (${
          state.deviceStatus
        })`
      )
      this.notifyConnectionStateListeners(reachable)
    }

    if (!reachable) {
      this.currentAppType = LedgerAppType.UNKNOWN
    }
  }

  /*
   * The kit's session state deliberately does NOT feed currentAppType. Its
   * `currentApp` reports BOLOS (the dashboard) on this transport even while an
   * app is open, and a direct GetAppAndVersion disagrees. With both writing,
   * the refresher (~1s) and refreshAppInfo (2s) overwrote each other and the
   * app type flapped Unknown <-> Avalanche. refreshAppInfo is the single
   * source; this only tracks reachability.
   */

  // Centralized reconnect entry. The BLE transport retries unexpected drops on
  // its own, so this only covers sessions we closed deliberately — most of all
  // the background→foreground cycle, where disconnect({ manual: false })
  // released the link and nothing else will bring it back.
  scheduleReconnect(reason: string): void {
    if (
      this.autoReconnectDisabled ||
      !this.connectedDeviceId ||
      this.isConnected()
    ) {
      return
    }
    Logger.info(`Scheduling Ledger reconnect: ${reason}`)
    this.connect(this.connectedDeviceId).catch(Logger.error)
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

  // Two independent feeds: the session subscription for reachability, and an
  // interval for the app type. The interval is not redundant — the kit's own
  // refresher reports the running app only once the session reaches a Ready
  // state, which does not happen reliably over this transport.
  private startAppPolling(): void {
    if (!this.#sessionId) return

    if (!this.sessionStateSubscription) {
      this.sessionStateSubscription = this.dmk
        .getDeviceSessionState({ sessionId: this.#sessionId })
        .subscribe({
          next: state => this.handleSessionState(state),
          error: error => Logger.error('Ledger session state error', error)
        })
    }

    if (this.appPollingInterval === null) {
      this.appPollingInterval = setInterval(() => {
        void this.refreshAppInfo()
      }, LEDGER_TIMEOUTS.APP_POLLING_INTERVAL)
    }
  }

  /** Reads the running app straight from the device. */
  private async refreshAppInfo(): Promise<void> {
    if (this.appPollInFlight || !this.isConnected()) return
    this.appPollInFlight = true

    try {
      const { applicationName, version } = await this.getCurrentAppInfo()
      const newAppType = this.mapAppNameToType(applicationName)

      if (newAppType !== this.currentAppType) {
        Logger.info(`App changed from ${this.currentAppType} to ${newAppType}`)
        this.currentAppType = newAppType
      }
      this.currentAppVersion = version
      this.recordLedgerAppSentryTags(newAppType, version)
    } catch {
      // Expected while the device is switching apps; keep polling.
    } finally {
      this.appPollInFlight = false
    }
  }

  // Screens call this on unmount while the session lives on, so it must not
  // drop the reachability subscription — that belongs to teardownSession.
  stopAppPolling(): void {
    if (this.appPollingInterval !== null) {
      clearInterval(this.appPollingInterval)
      this.appPollingInterval = null
    }
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
    // Drop devices from a previous scan: their DiscoveredDevice handles may no
    // longer be connectable, and connect() would prefer them over a fresh one.
    this.discoveredDevices.clear()

    try {
      // listenToAvailableDevices emits the whole known-device list on every
      // change, so each emission replaces currentDevices outright rather than
      // accumulating 'add' events.
      this.scanSubscription = this.dmk
        .listenToAvailableDevices({ transport: rnBleTransportIdentifier })
        .subscribe({
          next: (devices: DiscoveredDevice[]) => {
            devices.forEach(device =>
              this.discoveredDevices.set(device.id, device)
            )

            this.currentDevices = devices.map(device => ({
              id: device.id,
              name: device.name || 'Unknown Device',
              rssi: device.rssi ?? undefined
            }))

            this.notifyDeviceListeners()
          },
          error: (error: Error) => {
            this.handleScanError(error, onScanError)
          },
          complete: () => {
            Logger.info('Device scanning completed')
          }
        })

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
    this.dmk.stopDiscovering().catch(Logger.error)
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
    this.discoveredDevices.delete(deviceId)
    this.notifyDeviceListeners()
  }

  private async getCurrentAppInfo(): Promise<AppInfo> {
    return this.withSession(async ({ dmk, sessionId }) => {
      const result = await this.withTimeout(
        dmk.sendCommand({
          sessionId,
          command: new GetAppAndVersionCommand(),
          abortTimeout: LEDGER_TIMEOUTS.APDU_TIMEOUT
        }),
        LEDGER_TIMEOUTS.APDU_TIMEOUT,
        'getAppAndVersion'
      )

      if (!isSuccessCommandResult(result)) {
        throw new Error(
          `Ledger getAppAndVersion failed: ${describeDmkError(result.error)}`,
          { cause: result.error }
        )
      }

      return {
        applicationName: result.data.name,
        version: result.data.version
      }
    })
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
      // The dashboard/OS. A normal state, not an unrecognised app, so it is
      // mapped quietly rather than logged on every poll.
      case 'bolos':
        return LedgerAppType.UNKNOWN
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
      this.recordLedgerAppSentryTags(detectedAppType, appInfo.version)

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

      // The device drops BLE while it switches apps and the transport brings
      // the same session back, so an unreachable device here means "not ready
      // yet", not "gone". Only the deadline below ends the wait.
      if (this.isConnected() && (await this.checkApp(appType))) {
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

  // Gatekeeper — wraps all SDK calls with a fast-fail session check.
  // If the session is gone, the caller finds out immediately instead
  // of hanging on a background retry.
  /**
   * Hard ceiling on anything the kit returns. A command issued while the
   * device is dropping BLE can leave a promise that never settles — the kit's
   * own abortTimeout did not fire in that case — and one of those wedges
   * connect(), which the in-flight mutex then turns into a permanent stall for
   * every later attempt.
   */
  private async withTimeout<T>(
    work: Promise<T>,
    ms: number,
    what: string
  ): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined

    try {
      return await Promise.race([
        work,
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error(`Ledger ${what} timed out after ${ms}ms`)),
            ms
          )
        })
      ])
    } finally {
      if (timer) clearTimeout(timer)
    }
  }

  private async withSession<T>(
    operation: (session: LedgerSession) => Promise<T>
  ): Promise<T> {
    return operation(this.getSession())
  }

  /**
   * The Avalanche app SDK talks over a plain APDU `send`, but its C-chain
   * methods are driven by the kit's Ethereum signer, so it needs the session
   * itself alongside the transport wrapping it.
   */
  private avalancheApp({ dmk, sessionId }: LedgerSession): AvalancheApp {
    return new AvalancheApp(new DmkApduTransport(dmk, sessionId), {
      dmk,
      sessionId
    })
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

    return this.withSession(async session => {
      const avalancheApp = this.avalancheApp(session)

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
  // Pre-existing 4-arg signature; disabled rather than reshaped here because
  // changing it would touch every caller and is unrelated to CP-14964.
  // eslint-disable-next-line max-params
  async getAllAddresses(
    startIndex: number,
    count: number,
    isTestnet: boolean,
    derivationPathType?: LedgerDerivationPathType
  ): Promise<AddressInfo[]> {
    await this.ensureAppReady(LedgerAppType.AVALANCHE)

    return this.withSession(async session => {
      const avalancheApp = this.avalancheApp(session)
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
          address: getAddress(
            assertDeviceEvmAddress('getETHAddress', evmAddressResponse)
          ),
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
        const coreEthAddress = `C-${assertDeviceBech32Address(
          'getAddressAndPubKey(coreEth)',
          evmAvalancheAddressResponse,
          networkHrp
        )}`
        const coreEthPublicKey = assertDevicePublicKey(
          'getAddressAndPubKey(coreEth)',
          evmAvalancheAddressResponse
        )
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

        const addressWithoutPrefix = assertDeviceBech32Address(
          'getAddressAndPubKey(XP)',
          avalancheChainAddressResponse,
          networkHrp
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
          coreEthPublicKey,
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
    await this.teardownSession()
  }

  private async teardownSession(): Promise<void> {
    this.stopAppPolling()
    this.sessionStateSubscription?.unsubscribe()
    this.sessionStateSubscription = null

    const sessionId = this.#sessionId
    if (!sessionId) return

    this.#sessionId = null
    this.isDeviceReachable = false
    this.currentAppType = LedgerAppType.UNKNOWN
    this.notifyConnectionStateListeners(false)

    try {
      await this.dmk.disconnect({ sessionId })
    } catch (error) {
      Logger.error('Failed to disconnect Ledger session', error)
    }
  }

  // Forget the device: clear the remembered device ID and suppress
  // auto-reconnect. Call when the user switches away from a Ledger wallet.
  forgetDevice(): void {
    this.connectedDeviceId = null
    this.autoReconnectDisabled = true
  }

  isConnected(): boolean {
    return this.#sessionId !== null && this.isDeviceReachable
  }

  // Throws rather than retrying: callers should surface a reconnect prompt
  // instead of silently hanging on a dead session.
  getSession(): LedgerSession {
    if (!this.#dmk || !this.#sessionId || !this.isDeviceReachable) {
      throw new Error(LEDGER_ERROR_CODES.TRANSPORT_INTERFACE_NOT_AVAILABLE)
    }
    return { dmk: this.#dmk, sessionId: this.#sessionId }
  }

  // Ensure a live device session before returning it. Multi-step signing
  // flows (e.g. delegation, claim P→C) leave the link idle between steps;
  // a silent BLE drop or device sleep can leave the session unreachable by the
  // time the next step calls into the signer. ensureConnection reconnects
  // to the remembered deviceId in that case so the second prompt actually
  // reaches the device. connect() is mutex-guarded, so joining an
  // in-flight auto-reconnect is safe.
  async ensureConnection(): Promise<LedgerSession> {
    if (!this.connectedDeviceId) {
      throw new Error(LEDGER_ERROR_CODES.TRANSPORT_INTERFACE_NOT_AVAILABLE)
    }
    // A NOT_CONNECTED session is usually the transport retrying the link after
    // an app switch; reconnecting would tear down the session mid-recovery.
    if (
      this.#sessionId !== null &&
      !this.isConnected() &&
      (await this.waitUntilReachable(LEDGER_TIMEOUTS.RECONNECT_WAIT))
    ) {
      return this.getSession()
    }
    if (!this.isConnected()) {
      Logger.info('[ensureConnection] session unavailable — reconnecting')
      await this.connect(this.connectedDeviceId)
    }
    return this.getSession()
  }

  /**
   * Waits for the kit to report the device reachable again. Opening or closing
   * an app makes the device drop BLE; the transport reconnects the same
   * session, so the only correct response is to wait.
   */
  private async waitUntilReachable(timeoutMs: number): Promise<boolean> {
    const deadline = Date.now() + timeoutMs

    while (Date.now() < deadline) {
      if (this.isConnected()) return true
      await new Promise(res => setTimeout(res, LEDGER_TIMEOUTS.APP_CHECK_DELAY))
    }

    return this.isConnected()
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

    return this.withSession(async ({ dmk, sessionId }) => {
      const solanaSigner = new SignerSolanaBuilder({ dmk, sessionId }).build()

      // Use the SDK's derivation path function (same as other chains)
      const derivationPath = getAddressDerivationPath({
        accountIndex,
        vmType: NetworkVMType.SVM
      })
      // Remove 'm/' prefix if present (Ledger expects path without prefix)
      const ledgerDerivationPath = derivationPath.replace(/^m\//, '')
      // ensureAppReady already put the Solana app in front, so the signer's own
      // open-app step would only cost another round trip.
      const result = await runDeviceAction(
        solanaSigner.getAddress(ledgerDerivationPath, {
          checkOnDevice: false,
          skipOpenApp: true
        }),
        'getAddress(solana)'
      )

      const solanaAddress = assertDeviceSolanaBase58Address(
        'getAddress(solana)',
        result
      )

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

    // Fails closed rather than defaulting to ''. An empty string here reads as
    // a legitimately absent address downstream, which is how a corrupt XP
    // address reached persistence unnoticed (CP-14964).
    const findAddress = (type: LedgerAddressType): string => {
      const address = addresses.find(addr => addr.type === type)?.address

      if (!address) {
        throw new Error(
          `Ledger did not return a ${type} address for account ${accountIndex}`
        )
      }

      return address
    }

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
    return this.withSession(async session => {
      const avalancheApp = this.avalancheApp(session)
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
      const evmPublicKey = assertDevicePublicKey(
        'getAddressAndPubKey(evm)',
        evmKeyResponse
      )
      const avalanchePublicKey = assertDevicePublicKey(
        'getAddressAndPubKey(avalanche)',
        avalancheKeyResponse
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
            key: evmPublicKey.toString('hex'),
            derivationPath: evmPath,
            curve: Curve.SECP256K1
          },
          {
            key: avalanchePublicKey.toString('hex'),
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

    return this.withSession(async session => {
      const avalancheApp = this.avalancheApp(session)

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
          const evmPublicKey = assertDevicePublicKey(
            'getAddressAndPubKey(evm)',
            evmResponse
          )
          const avalanchePublicKey = assertDevicePublicKey(
            'getAddressAndPubKey(avalanche)',
            avalancheResponse
          )

          results.push({
            evmPubKey: evmPublicKey.toString('hex'),
            avalanchePubKey: avalanchePublicKey.toString('hex'),
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

  // Attempt to open a specific app on the Ledger device
  // Best-effort, does not guarantee success
  async openApp(app: LedgerAppType): Promise<void> {
    // The same double-driving that produced two connect() calls also produces
    // two overlapping openApp() calls, and two racing quit -> open sequences
    // leave the device in an unpredictable app. Share one attempt instead.
    const existing = this.openAppInFlight.get(app)
    if (existing) {
      Logger.info(`openApp(${app}) already in flight — joining`)
      return existing
    }

    const attempt = this.openAppInternal(app).finally(() => {
      this.openAppInFlight.delete(app)
    })
    this.openAppInFlight.set(app, attempt)
    return attempt
  }

  private async openAppInternal(app: LedgerAppType): Promise<void> {
    // Skip if an app that already satisfies the request is open. Sending the
    // open-app APDU from inside a running app makes the device exit and
    // restart into the new one, causing a BLE disconnect Android does not
    // reliably recover from — and for Bitcoin it is worse than that: the
    // Bitcoin Recovery app satisfies a BITCOIN request (isBitcoinCompatibleApp),
    // so an equality check here quit Recovery and opened the plain Bitcoin
    // app, which is the unsupported one the user was just told to avoid.
    // isAppCompatible is the same rule checkApp and ensureAppReady use.
    if (this.isAppCompatible(this.currentAppType, app)) {
      Logger.info(
        `${this.currentAppType} app already satisfies ${app}, skipping open request`
      )
      return
    }

    // An out-of-range Bitcoin app is open: reopening it would land on the same
    // unsupported version, so leave it for waitForApp to report that Bitcoin
    // Recovery is needed.
    if (
      app === LedgerAppType.BITCOIN &&
      this.currentAppType === LedgerAppType.BITCOIN
    ) {
      Logger.info('Unsupported Bitcoin app version open, skipping open request')
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
      // Quitting drops the BLE link; the open-app command below needs the
      // session reachable again or it would fail the fast-fail check.
      await this.waitUntilReachable(LEDGER_TIMEOUTS.RECONNECT_WAIT)
    }

    try {
      // OpenAppCommand (unlike the SDK's raw-APDU openLedgerApp) declares
      // triggersDisconnection, which the kit needs: the device drops BLE as it
      // switches apps, and without that flag the send never settles and blocks
      // the session's intent queue for every later command.
      // LedgerAppType's values are the ASCII app names the device expects.
      const result = await this.withSession(({ dmk, sessionId }) =>
        this.withTimeout(
          dmk.sendCommand({
            sessionId,
            command: new OpenAppCommand({ appName: app }),
            abortTimeout: LEDGER_TIMEOUTS.APDU_TIMEOUT
          }),
          LEDGER_TIMEOUTS.APDU_TIMEOUT,
          'openApp'
        )
      )

      if (isSuccessCommandResult(result)) {
        Logger.info(`Successfully opened ${app} app on Ledger device`)
      } else {
        Logger.info(`Device refused to open the ${app} app:`, result.error)
      }
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
      // CloseAppCommand declares triggersDisconnection — see openApp.
      const result = await this.withSession(({ dmk, sessionId }) =>
        this.withTimeout(
          dmk.sendCommand({
            sessionId,
            command: new CloseAppCommand(),
            abortTimeout: LEDGER_TIMEOUTS.APDU_TIMEOUT
          }),
          LEDGER_TIMEOUTS.APDU_TIMEOUT,
          'closeApp'
        )
      )
      if (!isSuccessCommandResult(result)) {
        Logger.info('Device refused to quit the current app:', result.error)
        return
      }
      this.currentAppType = LedgerAppType.UNKNOWN
      Logger.info('Successfully quit current Ledger app')
    } catch (error) {
      Logger.info('Failed to quit Ledger app:', error)
    }
  }
}

export default new LedgerService()
