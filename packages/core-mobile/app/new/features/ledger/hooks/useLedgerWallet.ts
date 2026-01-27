import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import { showSnackbar } from 'new/common/utils/toast'
import { useCallback, useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { selectIsLedgerSupportBlocked } from 'store/posthog'
import LedgerService from 'services/ledger/LedgerService'
import {
  LedgerDerivationPathType,
  LedgerKeys,
  LedgerTransportState,
  WalletCreationOptions,
  WalletUpdateOptions
} from 'services/ledger/types'
import { WalletType } from 'services/wallet/types'
import { PrimaryAccount, setAccount, setActiveAccountId } from 'store/account'
import { AppThunkDispatch } from 'store/types'
import { setActiveWallet } from 'store/wallet/slice'
import { storeWallet } from 'store/wallet/thunks'
import Logger from 'utils/Logger'
import { Curve } from 'utils/publicKeys'
import { uuid } from 'utils/uuid'
import { CoreAccountType } from '@avalabs/types'
import BiometricsSDK from 'utils/BiometricsSDK'
import { DERIVATION_PATHS } from '../consts'
import { LedgerWalletSecretSchema } from '../utils'

export interface UseLedgerWalletReturn {
  // Connection state
  isConnecting: boolean
  isLoading: boolean
  transportState: LedgerTransportState

  // Methods
  connectToDevice: (deviceId: string) => Promise<void>
  disconnectDevice: () => Promise<void>
  createLedgerWallet: (
    options: WalletCreationOptions & LedgerKeys
  ) => Promise<string>
  updateSolanaForLedgerWallet: (options: WalletUpdateOptions) => Promise<void>
}

export function useLedgerWallet(): UseLedgerWalletReturn {
  const dispatch = useDispatch<AppThunkDispatch>()
  const isLedgerBlocked = useSelector(selectIsLedgerSupportBlocked)
  const [transportState, setTransportState] = useState<LedgerTransportState>({
    available: false,
    powered: false
  })
  const [isConnecting, setIsConnecting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Monitor BLE transport state (skip if Ledger support is blocked to avoid requesting Bluetooth permissions)
  useEffect(() => {
    if (isLedgerBlocked) {
      return
    }

    const subscription = TransportBLE.observeState({
      next: (event: { available: boolean }) => {
        setTransportState({
          available: event.available,
          powered: false
        })
      },
      error: (error: Error) => {
        Alert.alert(
          'BLE Error',
          `Failed to monitor BLE state: ${error.message}`
        )
      },
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      complete: () => {}
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [isLedgerBlocked])

  // Connect to device
  const connectToDevice = useCallback(async (deviceId: string) => {
    setIsConnecting(true)
    try {
      await LedgerService.connect(deviceId)
      Logger.info('Connected to Ledger device')
    } catch (error) {
      Logger.error('Failed to connect to device', error)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }, [])

  // Disconnect device
  const disconnectDevice = useCallback(async () => {
    try {
      await LedgerService.disconnect()
      Logger.info('Disconnected from Ledger device')
    } catch (error) {
      Logger.error('Failed to disconnect', error)
      throw error
    }
  }, [])

  const createLedgerWallet = useCallback(
    async ({
      deviceId,
      deviceName = 'Ledger Device',
      derivationPathType = LedgerDerivationPathType.BIP44,
      individualKeys = [],
      avalancheKeys,
      solanaKeys = [],
      bitcoinAddress
    }: WalletCreationOptions & LedgerKeys) => {
      try {
        setIsLoading(true)

        Logger.info(
          `Creating ${derivationPathType} Ledger wallet with generated keys...`
        )

        if (!avalancheKeys) {
          throw new Error('Missing Avalanche keys for wallet creation')
        }
        // Solana keys are optional - wallet can be created with only Avalanche keys

        const newWalletId = uuid()

        // Use addresses for display and xpubs for wallet functionality
        const { addresses, xpubs } = avalancheKeys

        // Fix address formatting - remove double 0x prefixes that cause VM module errors
        const formattedAddresses = {
          evm: addresses.evm?.startsWith('0x0x')
            ? addresses.evm.slice(2) // Remove first 0x to fix double prefix
            : addresses.evm,
          avm: addresses.avm,
          pvm: addresses.pvm
        }

        // Also fix the public keys array to ensure no double prefixes in storage
        const formattedPublicKeys = individualKeys.map(key => ({
          ...key,
          key: key.key?.startsWith('0x0x') ? key.key.slice(2) : key.key
        }))

        // Create the public keys array for BIP44
        const publicKeysToStore = [
          // Use formatted addresses for BIP44
          {
            key: formattedAddresses.evm, // Use formatted address
            derivationPath: DERIVATION_PATHS.BIP44.EVM,
            curve: Curve.SECP256K1
          },
          {
            key: formattedAddresses.avm,
            derivationPath: DERIVATION_PATHS.BIP44.AVALANCHE,
            curve: Curve.SECP256K1
          },
          {
            key: formattedAddresses.pvm,
            derivationPath: DERIVATION_PATHS.BIP44.PVM,
            curve: Curve.SECP256K1
          },
          // Only include Solana key if it exists
          ...(solanaKeys.length > 0 && solanaKeys[0]?.key
            ? [
                {
                  key: solanaKeys[0].key, // Solana addresses don't use 0x prefix
                  derivationPath: solanaKeys[0].derivationPath, // Use the same path from getSolanaKeys
                  curve: Curve.ED25519
                }
              ]
            : [])
        ]

        // Store the Ledger wallet with the specified derivation path type
        await dispatch(
          storeWallet({
            walletId: newWalletId,
            name: `Ledger ${deviceName}`,
            walletSecret: JSON.stringify({
              deviceId,
              deviceName,
              derivationPath: DERIVATION_PATHS.BIP44.EVM,
              vmType: 'EVM',
              derivationPathSpec: derivationPathType,
              ...(derivationPathType === LedgerDerivationPathType.BIP44 && {
                extendedPublicKeys: {
                  evm: xpubs.evm, // Store base58 xpub for derivation
                  avalanche: xpubs.avalanche // Store base58 xpub for derivation
                }
              }),
              publicKeys:
                derivationPathType === LedgerDerivationPathType.LedgerLive &&
                individualKeys.length > 0
                  ? formattedPublicKeys // Use formatted individual keys for Ledger Live
                  : publicKeysToStore, // Use the public keys we just created
              avalancheKeys: formattedAddresses, // Use formatted addresses for display
              solanaKeys
            }),
            type:
              derivationPathType === LedgerDerivationPathType.BIP44
                ? WalletType.LEDGER
                : WalletType.LEDGER_LIVE
          })
        ).unwrap()

        dispatch(setActiveWallet(newWalletId))

        // For the first account (index 0), use the addresses we retrieved during setup
        // This avoids the complex derivation logic that returns empty addresses
        const newAccountId = uuid()
        const newAccount: PrimaryAccount = {
          id: newAccountId,
          walletId: newWalletId,
          name: `Account 1`,
          type: CoreAccountType.PRIMARY,
          index: 0,
          addressC: formattedAddresses.evm,
          addressBTC: bitcoinAddress || '',
          addressAVM: formattedAddresses.avm,
          addressPVM: formattedAddresses.pvm,
          addressSVM: solanaKeys[0]?.key || '',
          addressCoreEth: '',
          xpAddresses: [],
          xpAddressDictionary: {},
          hasMigratedXpAddresses: true // TODO: true when xpAddresses are successfully fetched
        }

        dispatch(setAccount(newAccount))
        dispatch(setActiveAccountId(newAccountId))

        Logger.info('Ledger wallet created successfully:', newWalletId)
        showSnackbar('Ledger wallet created successfully!')
        return newWalletId
      } catch (error) {
        Logger.error('Failed to create Ledger wallet:', error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [dispatch]
  )

  const updateSolanaForLedgerWallet = useCallback(
    async ({
      deviceId,
      walletId,
      walletName,
      walletType,
      account,
      solanaKeys = []
    }: WalletUpdateOptions) => {
      try {
        setIsLoading(true)

        if (solanaKeys.length === 0 || !solanaKeys[0]?.key) {
          throw new Error('Missing Solana keys for wallet update')
        }

        const walletSecretResult = await BiometricsSDK.loadWalletSecret(
          walletId
        )

        if (
          walletSecretResult.success === false ||
          walletSecretResult.value === undefined
        ) {
          throw new Error('Failed to load existing wallet secret for update')
        }

        const parsedWalletSecret = LedgerWalletSecretSchema.parse(
          JSON.parse(walletSecretResult.value)
        )

        if (deviceId !== parsedWalletSecret.deviceId) {
          throw new Error(
            'Device ID mismatch between connected wallet and stored wallet'
          )
        }

        // Create the public keys array for BIP44
        const publicKeysToStore = [
          // Use formatted addresses for BIP44
          ...parsedWalletSecret.publicKeys,
          // Only include Solana key if it exists
          {
            key: solanaKeys[0].key, // Solana addresses don't use 0x prefix
            derivationPath: solanaKeys[0].derivationPath, // Use the same path from getSolanaKeys
            curve: Curve.ED25519
          }
        ]

        // Store the Ledger wallet with the specified derivation path type
        await dispatch(
          storeWallet({
            walletId,
            name: walletName,
            type: walletType,
            walletSecret: JSON.stringify({
              ...parsedWalletSecret,
              publicKeys: publicKeysToStore,
              solanaKeys
            })
          })
        ).unwrap()

        // For the first account (index 0), use the addresses we retrieved during setup
        // This avoids the complex derivation logic that returns empty addresses
        const updatedAccount: PrimaryAccount = {
          ...account,
          addressSVM: solanaKeys[0]?.key
        }

        dispatch(setAccount(updatedAccount))

        Logger.info('Solana address derived successfully')
        showSnackbar('Solana address derived successfully!')
      } catch (error) {
        Logger.error('Failed to derive Solana address:', error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [dispatch]
  )

  return {
    isConnecting,
    transportState,
    connectToDevice,
    disconnectDevice,
    isLoading,
    createLedgerWallet,
    updateSolanaForLedgerWallet
  }
}
