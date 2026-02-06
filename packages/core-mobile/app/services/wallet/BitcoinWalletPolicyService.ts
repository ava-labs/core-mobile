import { createWalletPolicy } from '@avalabs/core-wallets-sdk'
import Logger from 'utils/Logger'
import BiometricsSDK from 'utils/BiometricsSDK'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { Curve } from 'utils/publicKeys'
import { BtcWalletPolicyDetails } from '@avalabs/vm-module-types'
import { PublicKey } from 'services/ledger/types'
import { getAddressDerivationPath } from './utils'

export interface WalletPolicyDetails {
  hmac: Buffer
  policy: ReturnType<typeof createWalletPolicy>
}

export interface BitcoinWalletPolicyRegistrationResult {
  success: boolean
  error?: string
  policyDetails?: WalletPolicyDetails
}

export class BitcoinWalletPolicyService {
  /**
   * Parse wallet policy details from public key data for Bitcoin signing
   */
  static parseWalletPolicyDetailsFromPublicKey(
    btcWalletPolicy: BtcWalletPolicyDetails,
    accountIndex = 0
  ): WalletPolicyDetails {
    if (!btcWalletPolicy) {
      throw new Error(
        'Bitcoin wallet policy details not found in public key data.'
      )
    }

    const hmac = Buffer.from(btcWalletPolicy.hmacHex, 'hex')
    const policy = createWalletPolicy(
      btcWalletPolicy.masterFingerprint,
      accountIndex,
      btcWalletPolicy.xpub,
      btcWalletPolicy.name
    )

    return { hmac, policy }
  }

  /**
   * Find Bitcoin wallet policy details in public keys array
   */
  static findBtcWalletPolicyInPublicKeys(
    publicKeys: PublicKey[]
  ): BtcWalletPolicyDetails | undefined {
    for (const pubKey of publicKeys) {
      if (pubKey.btcWalletPolicy) {
        return pubKey.btcWalletPolicy
      }
    }
    return undefined
  }

  /**
   * Store Bitcoin wallet policy details in the wallet's public key data
   * Assumes the hook/LedgerService has already fetched the policy details from the device
   */
  static async storeBtcWalletPolicy({
    walletId,
    publicKeys,
    policyDetails,
    accountIndex
  }: {
    walletId: string
    publicKeys: PublicKey[]
    policyDetails: BtcWalletPolicyDetails
    accountIndex: number
  }): Promise<boolean> {
    try {
      Logger.info('Storing Bitcoin wallet policy details in wallet data')

      // Generate the Bitcoin derivation path for the given account index
      const evmPath = getAddressDerivationPath({
        accountIndex,
        vmType: NetworkVMType.EVM
      })

      // Find the Bitcoin public key and add policy details
      const updatedPublicKeys = publicKeys.map(pk => {
        if (pk.curve === Curve.SECP256K1 && pk.derivationPath === evmPath) {
          return {
            ...pk,
            btcWalletPolicy: policyDetails
          }
        }
        return pk
      })

      // Load current wallet data from BiometricsSDK
      const walletSecretResult = await BiometricsSDK.loadWalletSecret(walletId)
      if (!walletSecretResult.success) {
        Logger.error('Failed to load wallet secret for Bitcoin policy update')
        return false
      }

      // Parse the current wallet data
      const currentWalletData = JSON.parse(walletSecretResult.value)

      // Update the publicKeys array with new policy details
      const updatedWalletData = {
        ...currentWalletData,
        publicKeys: updatedPublicKeys
      }

      // Store the updated wallet data back to BiometricsSDK
      const storeResult = await BiometricsSDK.storeWalletSecret(
        walletId,
        JSON.stringify(updatedWalletData)
      )

      if (!storeResult) {
        Logger.error('Failed to store updated wallet data with Bitcoin policy')
        return false
      }

      Logger.info('Successfully stored Bitcoin wallet policy details')
      return true
    } catch (error) {
      Logger.error('Failed to store Bitcoin wallet policy:', error)
      return false
    }
  }

  /**
   * Check if Bitcoin wallet policy registration is needed
   */
  static needsBtcWalletPolicyRegistration(publicKeys: PublicKey[]): boolean {
    return !publicKeys.some(pk => pk.btcWalletPolicy)
  }

  /**
   * Get the EVM public key that should have the wallet policy
   */
  static getEvmPublicKey(
    publicKeys: PublicKey[],
    accountIndex: number
  ):
    | {
        key: string
        derivationPath: string
        curve: Curve
      }
    | undefined {
    // Generate the EVM derivation path for the given account index
    const evmPath = getAddressDerivationPath({
      accountIndex,
      vmType: NetworkVMType.EVM
    })

    // Find the EVM public key using the generated path
    return publicKeys.find(
      pk => pk.curve === Curve.SECP256K1 && pk.derivationPath === evmPath
    )
  }
}
