import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import AppAvalanche from '@avalabs/hw-app-avalanche'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { getAddressDerivationPath } from 'services/wallet/utils'
import { ChainName } from 'services/network/consts'
import { getBtcAddressFromPubKey } from '@avalabs/core-wallets-sdk'
import { networks } from 'bitcoinjs-lib'

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

export class LedgerService {
  private transport: any = null
  private avalancheApp: AppAvalanche | null = null

  // Connect to Ledger device
  async connect(deviceId: string): Promise<void> {
    try {
      this.transport = await TransportBLE.open(deviceId)
      this.avalancheApp = new AppAvalanche(this.transport)
    } catch (error) {
      throw new Error(
        `Failed to connect to Ledger: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  // Get extended public keys for BIP44 derivation
  async getExtendedPublicKeys(): Promise<{
    evm: ExtendedPublicKey
    avalanche: ExtendedPublicKey
  }> {
    if (!this.avalancheApp) {
      throw new Error('Avalanche app not initialized')
    }

    try {
      // Get EVM extended public key (m/44'/60'/0')
      const evmXpubResponse = await this.avalancheApp.getExtendedPubKey(
        getAddressDerivationPath({
          accountIndex: 0,
          vmType: NetworkVMType.EVM
        }).replace('/0/0', ''),
        false
      )

      // Check for error response
      if (evmXpubResponse.returnCode !== 0x9000) {
        throw new Error(
          `EVM extended public key error: ${
            evmXpubResponse.errorMessage || 'Unknown error'
          }`
        )
      }

      // Get Avalanche extended public key (m/44'/9000'/0')
      const avalancheXpubResponse = await this.avalancheApp.getExtendedPubKey(
        getAddressDerivationPath({
          accountIndex: 0,
          vmType: NetworkVMType.AVM
        }).replace('/0/0', ''),
        false
      )

      // Check for error response
      if (avalancheXpubResponse.returnCode !== 0x9000) {
        throw new Error(
          `Avalanche extended public key error: ${
            avalancheXpubResponse.errorMessage || 'Unknown error'
          }`
        )
      }

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
      throw new Error(`Failed to get extended public keys: ${error}`)
    }
  }

  // Get individual public keys for LedgerLive derivation
  async getPublicKeys(
    startIndex: number,
    count: number
  ): Promise<PublicKeyInfo[]> {
    if (!this.avalancheApp) {
      throw new Error('Avalanche app not initialized')
    }

    const publicKeys: PublicKeyInfo[] = []

    try {
      for (let i = startIndex; i < startIndex + count; i++) {
        // EVM public key
        const evmPath = getAddressDerivationPath({
          accountIndex: i,
          vmType: NetworkVMType.EVM
        })
        const evmResponse = await this.avalancheApp.getAddressAndPubKey(
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
        const avmResponse = await this.avalancheApp.getAddressAndPubKey(
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
        const btcResponse = await this.avalancheApp.getAddressAndPubKey(
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
    if (!this.avalancheApp) {
      throw new Error('Avalanche app not initialized')
    }

    const addresses: AddressInfo[] = []

    try {
      // Derive addresses for each chain
      for (let i = startIndex; i < startIndex + count; i++) {
        // EVM addresses (Ethereum/Avalanche C-Chain) - get from device
        const evmPath = getAddressDerivationPath({
          accountIndex: i,
          vmType: NetworkVMType.EVM
        })
        const evmAddressResponse = await this.avalancheApp.getETHAddress(
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
        const xChainAddressResponse =
          await this.avalancheApp.getAddressAndPubKey(
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
        const pChainAddressResponse =
          await this.avalancheApp.getAddressAndPubKey(
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
        const btcPublicKeyResponse =
          await this.avalancheApp.getAddressAndPubKey(
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

  // Disconnect from Ledger device
  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.transport.close()
      this.transport = null
      this.avalancheApp = null
    }
  }
}

export default new LedgerService()
