import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
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

export interface AddressInfo {
  id: string
  address: string
  derivationPath: string
  network: string
}

export interface ExtendedPublicKey {
  path: string
  key: string
  chainCode: string
}

export interface PublicKeyInfo {
  key: string
  derivationPath: string
  curve: 'secp256k1' | 'ed25519'
}

export enum LedgerAppType {
  AVALANCHE = 'Avalanche',
  SOLANA = 'Solana',
  UNKNOWN = 'Unknown'
}

export interface AppInfo {
  applicationName: string
  version: string
}

export class LedgerService {
  private transport: any = null
  private currentAppType: LedgerAppType = LedgerAppType.UNKNOWN
  private appPollingInterval: NodeJS.Timeout | null = null
  private appPollingEnabled = false

  // Connect to Ledger device (transport only, no apps)
  async connect(deviceId: string): Promise<void> {
    try {
      // Use a longer timeout for connection (30 seconds)
      this.transport = await TransportBLE.open(deviceId, 30000)
      Logger.info('BLE transport connected successfully')
      this.currentAppType = LedgerAppType.UNKNOWN

      // Start passive app detection
      this.startAppPolling()
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
        if (!this.transport || this.transport.isDisconnected) {
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
    }, 2000) // Poll every 2 seconds like the extension
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
    if (!this.transport) {
      throw new Error('Transport not initialized')
    }

    return await getLedgerAppInfo(this.transport)
  }

  // Map app name to our enum
  private mapAppNameToType(appName: string): LedgerAppType {
    switch (appName.toLowerCase()) {
      case 'avalanche':
        return LedgerAppType.AVALANCHE
      case 'solana':
        return LedgerAppType.SOLANA
      default:
        return LedgerAppType.UNKNOWN
    }
  }

  // Get current app type (passive detection)
  getCurrentAppType(): LedgerAppType {
    return this.currentAppType
  }

  // Wait for specific app to be open (passive approach)
  async waitForApp(appType: LedgerAppType, timeoutMs = 30000): Promise<void> {
    const startTime = Date.now()
    Logger.info(`Waiting for ${appType} app (timeout: ${timeoutMs}ms)...`)

    while (Date.now() - startTime < timeoutMs) {
      Logger.info(`Current app type: ${this.currentAppType}, waiting for: ${appType}`)
      
      if (this.currentAppType === appType) {
        Logger.info(`${appType} app is ready`)
        return
      }

      // Wait 1 second before next check
      await new Promise(resolve => setTimeout(resolve, 1000))
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

    if (!this.transport || this.transport.isDisconnected) {
      Logger.info('Transport is disconnected, attempting reconnection')
      await this.connect(deviceId)
    }
  }

  // Get extended public keys for BIP44 derivation
  async getExtendedPublicKeys(): Promise<{
    evm: ExtendedPublicKey
    avalanche: ExtendedPublicKey
  }> {
    if (!this.transport) {
      throw new Error('Transport not initialized')
    }

    Logger.info('=== getExtendedPublicKeys STARTED ===')
    Logger.info('Current app type:', this.currentAppType)

    // Connect to Avalanche app
    Logger.info('Waiting for Avalanche app...')
    await this.waitForApp(LedgerAppType.AVALANCHE)
    Logger.info('Avalanche app detected, creating app instance...')

    // Create Avalanche app instance
    const avalancheApp = new AppAvalanche(this.transport)
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
      if (evmXpubResponse.returnCode !== 0x9000) {
        Logger.error('EVM extended public key error:', evmXpubResponse.errorMessage)
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

      Logger.info('Avalanche response return code:', avalancheXpubResponse.returnCode)
      
      // Check for error response
      if (avalancheXpubResponse.returnCode !== 0x9000) {
        Logger.error('Avalanche extended public key error:', avalancheXpubResponse.errorMessage)
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
    
    Logger.info('=== getExtendedPublicKeys COMPLETED SUCCESSFULLY ===')
  }

  // Check if Solana app is open
  async checkSolanaApp(): Promise<boolean> {
    if (!this.transport) {
      return false
    }

    try {
      // Create fresh Solana app instance
      const solanaApp = new AppSolana(this.transport)
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

  // Get Solana public keys using SDK function (like extension)
  async getSolanaPublicKeys(startIndex: number): Promise<PublicKeyInfo[]> {
    if (!this.transport) {
      throw new Error('Transport not initialized')
    }

    // Create a fresh AppSolana instance for each call (like the SDK does)
    const freshSolanaApp = new AppSolana(this.transport)

    // Use correct Solana derivation path format
    const derivationPath = `44'/501'/0'/0'/${startIndex}`

    try {
      // Simple direct call to get Solana address using fresh instance
      const result = await freshSolanaApp.getAddress(derivationPath, false)
      const publicKey = result.address

      console.log('HIT PUBLIC KEY', publicKey)

      const publicKeys: PublicKeyInfo[] = [
        {
          key: publicKey.toString('hex'),
          derivationPath,
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
    if (!this.transport) {
      throw new Error('Transport not initialized')
    }

    try {
      // Use the SDK function directly (like the extension does)
      const publicKey = await getSolanaPublicKeyFromLedger(
        startIndex,
        this.transport
      )

      console.log('HIT PUBLIC KEY via SDK', publicKey)

      const publicKeys: PublicKeyInfo[] = [
        {
          key: publicKey.toString('hex'),
          derivationPath: `44'/501'/0'/0'/${startIndex}`,
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

  // Robust method with timeout and retry logic
  async getSolanaPublicKeysRobust(
    startIndex: number,
    _count: number
  ): Promise<PublicKeyInfo[]> {
    if (!this.transport) {
      throw new Error('Transport not initialized')
    }

    const maxRetries = 3
    const retryDelay = 1000 // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        Logger.info(`Solana attempt ${attempt}/${maxRetries}`)

        // Create a fresh transport connection for each attempt
        const freshTransport = await TransportBLE.open(
          this.transport.deviceId || 'unknown',
          15000
        )

        // Create fresh app instance
        const freshSolanaApp = new AppSolana(freshTransport)

        // Use derivation path
        const derivationPath = `44'/501'/0'/0'/${startIndex}`

        // Call with timeout wrapper
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error('Solana getAddress timeout')),
            10000
          )
        })

        const getAddressPromise = freshSolanaApp.getAddress(
          derivationPath,
          false
        )

        const result = await Promise.race([getAddressPromise, timeoutPromise])
        const publicKey = result.address

        console.log('HIT PUBLIC KEY robust method', publicKey)

        // Close the fresh transport
        await freshTransport.close()

        const publicKeys: PublicKeyInfo[] = [
          {
            key: publicKey.toString('hex'),
            derivationPath,
            curve: 'ed25519'
          }
        ]

        return publicKeys
      } catch (error) {
        Logger.error(`Solana attempt ${attempt} failed:`, error)

        if (attempt === maxRetries) {
          if (error instanceof Error) {
            if (error.message.includes('6a80')) {
              throw new Error(
                'Wrong app open. Please open the Solana app on your Ledger device.'
              )
            }
            if (error.message.includes('DisconnectedDevice')) {
              throw new Error(
                'Ledger device disconnected. Please ensure the Solana app is open and try again.'
              )
            }
            throw new Error(
              `Failed to get Solana address after ${maxRetries} attempts: ${error.message}`
            )
          }
          throw new Error(
            `Failed to get Solana address after ${maxRetries} attempts`
          )
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }

    throw new Error('Unexpected error in getSolanaPublicKeysRobust')
  }

  // Get Solana addresses from public keys
  async getSolanaAddresses(
    startIndex: number,
    count: number
  ): Promise<AddressInfo[]> {
    Logger.info('Starting getSolanaAddresses')
    try {
      const publicKeys = await this.getSolanaPublicKeys(startIndex)
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
    if (!this.transport) {
      throw new Error('Transport not initialized')
    }

    // Connect to Avalanche app
    await this.waitForApp(LedgerAppType.AVALANCHE)

    // Create Avalanche app instance
    const avalancheApp = new AppAvalanche(this.transport)

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
    if (!this.transport) {
      throw new Error('Transport not initialized')
    }

    // Connect to Avalanche app
    await this.waitForApp(LedgerAppType.AVALANCHE)

    // Create Avalanche app instance
    const avalancheApp = new AppAvalanche(this.transport)

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
    if (this.transport) {
      await this.transport.close()
      this.transport = null
      this.currentAppType = LedgerAppType.UNKNOWN
      this.stopAppPolling() // Stop polling on disconnect
    }
  }
}

export default new LedgerService()
