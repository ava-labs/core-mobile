import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import Transport from '@ledgerhq/hw-transport'
import AppAvalanche from '@avalabs/hw-app-avalanche'
import AppSolana from '@ledgerhq/hw-app-solana'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { getAddressDerivationPath } from 'services/wallet/utils'
import { ChainName } from 'services/network/consts'
import {
  getBtcAddressFromPubKey,
  getSolanaPublicKeyFromLedger,
  getLedgerAppInfo
} from '@avalabs/core-wallets-sdk'
import { networks } from 'bitcoinjs-lib'
import Logger from 'utils/Logger'
import bs58 from 'bs58'
import { Platform, PermissionsAndroid, Alert } from 'react-native'
import {
  LEDGER_TIMEOUTS
} from 'new/features/ledger/consts'
import { assertNotNull } from 'utils/assertions'
import {
  AddressInfo,
  ExtendedPublicKey,
  PublicKeyInfo,
  LedgerAppType,
  LedgerReturnCode,
  AppInfo,
  LedgerDevice
} from './types'

class LedgerService {
  #transport: TransportBLE | null = null
  private currentAppType: LedgerAppType = LedgerAppType.UNKNOWN
  private appPollingInterval: number | null = null
  private appPollingEnabled = false

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

  // Connect to Ledger device (transport only, no apps)
  async connect(deviceId: string): Promise<void> {
    try {
      Logger.info('Starting BLE connection attempt with deviceId:', deviceId)
      console.log('🔗 Connecting to device:', deviceId)

      // Use a longer timeout for connection
      this.transport = await TransportBLE.open(
        deviceId,
        LEDGER_TIMEOUTS.CONNECTION_TIMEOUT
      )
      Logger.info('BLE transport connected successfully')
      console.log('✅ BLE transport connected, checking connection status...')
      console.log('🔌 Transport isConnected:', this.#transport?.isConnected)

      this.currentAppType = LedgerAppType.UNKNOWN

      // Start passive app detection
      Logger.info('Starting app polling...')
      console.log('🚀 Starting app polling...')
      this.startAppPolling()
      Logger.info('App polling started')
      console.log('✅ App polling started successfully')

      // Test immediate app info call and update currentAppType
      console.log('🧪 Testing immediate app info call...')
      try {
        const testAppInfo = await this.getCurrentAppInfo()
        console.log('✅ Immediate app info test successful:', testAppInfo)
        // Update currentAppType immediately so waitForApp doesn't have to wait
        const detectedAppType = this.mapAppNameToType(testAppInfo.applicationName)
        console.log(`🎯 Immediately detected app type: ${detectedAppType}`)
        this.currentAppType = detectedAppType
      } catch (testError) {
        console.log('❌ Immediate app info test failed:', testError.message)
      }
    } catch (error) {
      console.log('❌ Connection failed:', error.message)
      Logger.error('Failed to connect to Ledger', error)
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

  // Request Bluetooth permissions (matching original implementation)
  private async requestBluetoothPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        ].filter(Boolean)

        const granted = await PermissionsAndroid.requestMultiple(permissions)
        return Object.values(granted).every(
          permission => permission === 'granted'
        )
      } catch (err) {
        console.log('❌ Error requesting Bluetooth permissions:', err)
        return false
      }
    }
    return true
  }

  // Handle scan errors (matching original implementation)
  private handleScanError(error: Error): void {
    console.log('❌ Scan error:', error.message)
    this.stopDeviceScanning()

    if (
      error.message?.includes('not authorized') ||
      error.message?.includes('Origin: 101')
    ) {
      Alert.alert(
        'Bluetooth Permission Required',
        'Please enable Bluetooth permissions in your device settings to scan for Ledger devices.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              // Handle settings navigation if needed
            }
          }
        ]
      )
    } else {
      Alert.alert('Scan Error', `Failed to scan for devices: ${error.message}`)
    }
  }

  // Device scanning methods (matching original implementation)
  async startDeviceScanning(): Promise<void> {
    if (this.isScanning) {
      Logger.info('Device scanning already in progress')
      return
    }

    // Request permissions first
    console.log('🔐 Requesting Bluetooth permissions...')
    const hasPermissions = await this.requestBluetoothPermissions()
    if (!hasPermissions) {
      Alert.alert(
        'Permission Required',
        'Bluetooth permissions are required to scan for Ledger devices.'
      )
      return
    }
    console.log('✅ Bluetooth permissions granted')

    Logger.info('Starting device scanning...')
    console.log('🔍 Starting device scanning...')
    this.isScanning = true
    this.currentDevices = []

    try {
      this.scanSubscription = TransportBLE.listen({
        next: (event: {
          type: string
          descriptor: { id: string; name?: string; rssi?: number }
        }) => {
          console.log('📡 BLE event:', event.type, event.descriptor)
          if (event.type === 'add') {
            const device: LedgerDevice = {
              id: event.descriptor.id,
              name: event.descriptor.name || 'Unknown Device',
              rssi: event.descriptor.rssi
            }

            console.log('📱 Found device:', device)

            // Update device list (matching original logic)
            const exists = this.currentDevices.find(d => d.id === device.id)
            if (!exists) {
              this.currentDevices = [...this.currentDevices, device]
              console.log('➕ Added new device to list')
            } else {
              console.log('🔄 Device already exists, updating...')
            }

            // Notify all listeners
            this.notifyDeviceListeners()
          }
        },
        error: (error: Error) => {
          console.log('❌ TransportBLE.listen error:', error.message)
          this.handleScanError(error)
        },

        complete: () => {
          console.log('✅ TransportBLE.listen completed')
        }
      })

      console.log('⏰ Setting scan timeout...')
      // Auto-stop scanning after timeout (matching original)
      setTimeout(() => {
        console.log('⏰ Scan timeout reached, stopping...')
        this.stopDeviceScanning()
      }, LEDGER_TIMEOUTS.SCAN_TIMEOUT)
    } catch (error) {
      console.log('❌ Failed to start scanning:', error)
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
      console.log('📡 Calling getLedgerAppInfo...')
      const appInfo = await getLedgerAppInfo(this.transport as Transport)
      console.log('📋 Raw app info from SDK:', JSON.stringify(appInfo, null, 2))
      return appInfo
    } catch (error) {
      console.log('❌ Error getting app info from SDK:', error.message)
      throw error
    }
  }

  // Map app name to our enum
  private mapAppNameToType(appName: string): LedgerAppType {
    const lowerAppName = appName.toLowerCase()
    console.log(`🔍 Mapping app name: "${appName}" -> "${lowerAppName}"`)

    switch (lowerAppName) {
      case 'avalanche':
      case 'avax':
      case 'avalanche wallet':
        console.log('✅ Matched Avalanche app')
        return LedgerAppType.AVALANCHE
      case 'solana':
      case 'sol':
        console.log('✅ Matched Solana app')
        return LedgerAppType.SOLANA
      case 'ethereum':
      case 'eth':
        console.log('✅ Matched Ethereum app')
        return LedgerAppType.ETHEREUM
      default:
        console.log(
          `❓ Unknown app name: "${appName}" (lowercase: "${lowerAppName}")`
        )
        return LedgerAppType.UNKNOWN
    }
  }

  // Get current app type (passive detection)
  getCurrentAppType(): LedgerAppType {
    return this.currentAppType
  }

  // Wait for specific app to be open (Promise-based, works with polling)
  async waitForApp(
    appType: LedgerAppType,
    timeoutMs = LEDGER_TIMEOUTS.APP_WAIT_TIMEOUT
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      Logger.info(`Waiting for ${appType} app (timeout: ${timeoutMs}ms)...`)
      console.log(`⏳ Waiting for ${appType} app...`)

      // Check if app is already available
      if (this.currentAppType === appType) {
        console.log(`✅ ${appType} app already available`)
        Logger.info(`${appType} app is ready`)
        resolve()
        return
      }

      // Do an immediate check first
      const doCheck = async () => {
        const elapsed = Date.now() - startTime
        console.log(
          `⏳ Checking for ${appType} app (${elapsed}ms elapsed, current: ${this.currentAppType})`
        )

        try {
          console.log(`🔍 Actively checking app info for ${appType}...`)
          // Actively check the app instead of relying on cached currentAppType
          const appInfo = await this.getCurrentAppInfo()
          console.log(`📋 Got app info: ${appInfo.applicationName}`)
          const detectedAppType = this.mapAppNameToType(appInfo.applicationName)
          console.log(`🎯 Detected app type: ${detectedAppType}`)
          
          // Update currentAppType
          if (detectedAppType !== this.currentAppType) {
            console.log(`🔄 App changed from ${this.currentAppType} to ${detectedAppType}`)
            this.currentAppType = detectedAppType
          }

          if (this.currentAppType === appType) {
            console.log(`✅ ${appType} app detected!`)
            Logger.info(`${appType} app is ready`)
            clearInterval(checkInterval)
            resolve()
            return true // Found it
          } else {
            console.log(`⏸️  Still waiting... current: ${this.currentAppType}, waiting for: ${appType}`)
          }
        } catch (error) {
          console.log(`❌ Error checking app: ${error.message}`)
          console.log(`📊 Error details:`, error)
          // Continue checking, don't fail on single error
        }
        return false // Not found yet
      }

      // Do immediate check
      doCheck().then(found => {
        if (found) return
      })

      // Set up interval to actively check app type (don't rely on background polling)
      const checkInterval = setInterval(async () => {
        const found = await doCheck()
        if (found) return

        if (elapsed >= timeoutMs) {
          console.log(`⏰ Timeout waiting for ${appType} app`)
          Logger.error(
            `Timeout waiting for ${appType} app after ${timeoutMs}ms`
          )
          clearInterval(checkInterval)
          reject(
            new Error(
              `Timeout waiting for ${appType} app. Please open the ${appType} app on your Ledger device.`
            )
          )
          return
        }
      }, LEDGER_TIMEOUTS.APP_CHECK_DELAY)
    })
  }

  // Check if specific app is currently open
  async isAppOpen(appType: LedgerAppType): Promise<boolean> {
    try {
      const appInfo = await this.getCurrentAppInfo()
      const currentAppType = this.mapAppNameToType(appInfo.applicationName)
      return currentAppType === appType
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
  async getExtendedPublicKeys(): Promise<{
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
        accountIndex: 0,
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
        accountIndex: 0,
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
          path: getAddressDerivationPath({
            accountIndex: 0,
            vmType: NetworkVMType.EVM
          }).replace('/0/0', ''),
          key: evmXpubResponse.publicKey.toString('hex'),
          chainCode: evmXpubResponse.chain_code.toString('hex')
        },
        avalanche: {
          path: getAddressDerivationPath({
            accountIndex: 0,
            vmType: NetworkVMType.AVM
          }).replace('/0/0', ''),
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
          curve: 'ed25519'
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
          curve: 'ed25519'
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
          id: `solana-${startIndex + index}`,
          address,
          derivationPath: pk.derivationPath,
          network: ChainName.SOLANA
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
          curve: 'secp256k1'
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
          curve: 'secp256k1'
        })

        // Bitcoin public key
        const btcPath = getAddressDerivationPath({
          accountIndex: i,
          vmType: NetworkVMType.BITCOIN
        })
        const btcResponse = await avalancheApp.getAddressAndPubKey(
          btcPath,
          false,
          'bc'
        )
        publicKeys.push({
          key: btcResponse.publicKey.toString('hex'),
          derivationPath: btcPath,
          curve: 'secp256k1'
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
    count: number
  ): Promise<AddressInfo[]> {
    // Connect to Avalanche app
    await this.waitForApp(LedgerAppType.AVALANCHE)

    // Create Avalanche app instance
    const avalancheApp = new AppAvalanche(this.transport as Transport)

    const addresses: AddressInfo[] = []

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
          id: `evm-${i}`,
          address: evmAddressResponse.address,
          derivationPath: evmPath,
          network: ChainName.AVALANCHE_C_EVM
        })

        // AVM addresses (Avalanche X-Chain) - get from device
        const xChainPath = getAddressDerivationPath({
          accountIndex: i,
          vmType: NetworkVMType.AVM
        })
        const xChainAddressResponse = await avalancheApp.getAddressAndPubKey(
          xChainPath,
          false,
          'avax' // hrp for mainnet
        )
        addresses.push({
          id: `avalanche-x-${i}`,
          address: xChainAddressResponse.address,
          derivationPath: xChainPath,
          network: ChainName.AVALANCHE_X
        })

        // AVM addresses (Avalanche P-Chain) - get from device with P-Chain ID
        const pChainPath = getAddressDerivationPath({
          accountIndex: i,
          vmType: NetworkVMType.AVM
        })
        const pChainAddressResponse = await avalancheApp.getAddressAndPubKey(
          pChainPath,
          false,
          'avax', // hrp for mainnet
          '2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM' // P-Chain ID
        )
        addresses.push({
          id: `avalanche-p-${i}`,
          address: pChainAddressResponse.address,
          derivationPath: pChainPath,
          network: ChainName.AVALANCHE_P
        })

        // Bitcoin addresses - derive from EVM public key (like the extension)
        const btcPath = getAddressDerivationPath({
          accountIndex: i,
          vmType: NetworkVMType.EVM // Use EVM path for Bitcoin
        })
        const btcPublicKeyResponse = await avalancheApp.getAddressAndPubKey(
          btcPath,
          false,
          'avax' // hrp for mainnet
        )
        const btcAddress = getBtcAddressFromPubKey(
          Buffer.from(btcPublicKeyResponse.publicKey.toString('hex'), 'hex'),
          networks.bitcoin // mainnet
        )
        addresses.push({
          id: `bitcoin-${i}`,
          address: btcAddress,
          derivationPath: btcPath,
          network: ChainName.BITCOIN
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
    count: number
  ): Promise<AddressInfo[]> {
    const addresses: AddressInfo[] = []

    try {
      // Get Avalanche addresses first
      const avalancheAddresses = await this.getAllAddresses(startIndex, count)
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
    if (this.#transport) {
      await this.#transport.close()
      this.#transport = null
      this.currentAppType = LedgerAppType.UNKNOWN
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
  // DEBUG METHODS
  // ============================================================================

  /**
   * Manual test method to debug app detection
   */
  async testAppDetection(): Promise<void> {
    try {
      console.log('🧪 Manual app detection test starting...')
      console.log('🔌 Transport connected:', this.#transport?.isConnected)

      if (!this.#transport || !this.#transport.isConnected) {
        console.log('❌ No transport connection')
        return
      }

      console.log('📡 Calling getLedgerAppInfo manually...')
      const appInfo = await getLedgerAppInfo(this.transport as Transport)
      console.log(
        '📋 Manual app info result:',
        JSON.stringify(appInfo, null, 2)
      )

      const mappedType = this.mapAppNameToType(appInfo.applicationName)
      console.log('🎯 Mapped app type:', mappedType)

      console.log('🔄 Current stored app type:', this.currentAppType)
    } catch (error) {
      console.log('❌ Manual app detection test failed:', error.message)
      console.log('📊 Error details:', error)
    }
  }

  // ============================================================================
  // KEY RETRIEVAL METHODS
  // ============================================================================

  /**
   * Get Solana keys from the connected Ledger device
   * @returns Array of Solana keys with derivation paths
   */
  async getSolanaKeys(): Promise<
    Array<{
      key: string
      derivationPath: string
      curve: string
    }>
  > {
    Logger.info('Getting Solana keys with passive app detection')
    await this.waitForApp(LedgerAppType.SOLANA)

    // Get address directly from Solana app
    const transport = await this.getTransport()
    const solanaApp = new AppSolana(transport as Transport)

    // Use the SDK's derivation path function (same as other chains)
    const derivationPath = getAddressDerivationPath({
      accountIndex: 0,
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
        curve: 'ED25519'
      }
    ]
  }

  /**
   * Get Avalanche keys from the connected Ledger device
   * @returns Avalanche keys for EVM, Avalanche, and PVM chains
   */
  async getAvalancheKeys(): Promise<{
    evm: string
    avalanche: string
    pvm: string
  }> {
    Logger.info('Getting Avalanche keys')

    // Mirror the EXACT original logic from useLedgerWallet
    const addresses = await this.getAllAddresses(0, 1)

    const evmAddress =
      addresses.find(addr => addr.network === ChainName.AVALANCHE_C_EVM)
        ?.address || ''
    const xChainAddress =
      addresses.find(addr => addr.network === ChainName.AVALANCHE_X)?.address ||
      ''
    const pvmAddress =
      addresses.find(addr => addr.network === ChainName.AVALANCHE_P)?.address ||
      ''

    // Return addresses exactly like the original
    return {
      evm: evmAddress,
      avalanche: xChainAddress,
      pvm: pvmAddress
    }
  }

  /**
   * Get Bitcoin and XP addresses from Avalanche keys
   * @param avalancheKeys The avalanche keys to derive addresses from
   * @returns Bitcoin and XP addresses
   */
  async getBitcoinAndXPAddresses(): Promise<{
    bitcoinAddress: string
    xpAddress: string
  }> {
    const addresses = await this.getAllAddresses(0, 1)

    // Get addresses for display
    const xChainAddress =
      addresses.find(addr => addr.network === ChainName.AVALANCHE_X)?.address ||
      ''
    const btcAddress =
      addresses.find(addr => addr.network === ChainName.BITCOIN)?.address || ''

    return {
      bitcoinAddress: btcAddress,
      xpAddress: xChainAddress
    }
  }
}

export default new LedgerService()
