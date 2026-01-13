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
import {
  LEDGER_TIMEOUTS,
  getSolanaDerivationPath
} from 'new/features/ledger/consts'
import { assertNotNull } from 'utils/assertions'
import {
  AddressInfo,
  ExtendedPublicKey,
  PublicKeyInfo,
  LedgerAppType,
  LedgerReturnCode,
  AppInfo
} from './types'

export class LedgerService {
  #transport: TransportBLE | null = null
  private currentAppType: LedgerAppType = LedgerAppType.UNKNOWN
  private appPollingInterval: number | null = null
  private appPollingEnabled = false

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
      // Use a longer timeout for connection
      this.transport = await TransportBLE.open(
        deviceId,
        LEDGER_TIMEOUTS.CONNECTION_TIMEOUT
      )
      Logger.info('BLE transport connected successfully')
      this.currentAppType = LedgerAppType.UNKNOWN

      // Start passive app detection
      Logger.info('Starting app polling...')
      this.startAppPolling()
      Logger.info('App polling started')
    } catch (error) {
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
    if (this.appPollingEnabled) return

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
    }, LEDGER_TIMEOUTS.APP_POLLING_INTERVAL) // Poll every 2 seconds like the extension
  }

  // Stop passive app detection polling
  private stopAppPolling(): void {
    if (this.appPollingInterval) {
      clearInterval(this.appPollingInterval)
      this.appPollingInterval = null
    }
    this.appPollingEnabled = false
  }

  // Get current app info from device
  private async getCurrentAppInfo(): Promise<AppInfo> {
    return await getLedgerAppInfo(this.transport as Transport)
  }

  // Map app name to our enum
  private mapAppNameToType(appName: string): LedgerAppType {
    switch (appName.toLowerCase()) {
      case 'avalanche':
        return LedgerAppType.AVALANCHE
      case 'solana':
        return LedgerAppType.SOLANA
      case 'ethereum':
        return LedgerAppType.ETHEREUM
      case 'bitcoin':
        return LedgerAppType.BITCOIN
      default:
        return LedgerAppType.UNKNOWN
    }
  }

  // Get current app type (passive detection)
  getCurrentAppType(): LedgerAppType {
    return this.currentAppType
  }

  // Wait for specific app to be open (passive approach)
  async waitForApp(
    appType: LedgerAppType,
    timeoutMs = LEDGER_TIMEOUTS.APP_WAIT_TIMEOUT
  ): Promise<void> {
    const startTime = Date.now()
    Logger.info(`Waiting for ${appType} app (timeout: ${timeoutMs}ms)...`)

    while (Date.now() - startTime < timeoutMs) {
      Logger.info(
        `Current app type: ${this.currentAppType}, waiting for: ${appType}`
      )

      if (this.currentAppType === appType) {
        Logger.info(`${appType} app is ready`)
        return
      }

      // Wait before next check
      await new Promise(resolve =>
        setTimeout(resolve, LEDGER_TIMEOUTS.APP_CHECK_DELAY)
      )
    }

    Logger.error(`Timeout waiting for ${appType} app after ${timeoutMs}ms`)
    throw new Error(
      `Timeout waiting for ${appType} app. Please open the ${appType} app on your Ledger device.`
    )
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
}

export default new LedgerService()
