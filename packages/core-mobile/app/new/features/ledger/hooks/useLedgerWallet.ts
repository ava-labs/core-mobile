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
  WalletUpdateOptions,
  WalletUpdateSolanaOptions
} from 'services/ledger/types'
import { WalletType } from 'services/wallet/types'
import { PrimaryAccount, setAccount, setActiveAccountId } from 'store/account'
import { AppThunkDispatch } from 'store/types'
import { setActiveWallet } from 'store/wallet/slice'
import { storeWallet } from 'store/wallet/thunks'
import Logger from 'utils/Logger'
import { uuid } from 'utils/uuid'
import { CoreAccountType } from '@avalabs/types'
import BiometricsSDK from 'utils/BiometricsSDK'
import { LedgerWalletSecretSchema } from '../utils'
import { useLedgerWalletMap } from '../store'

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
  ) => Promise<{ walletId: string; accountId: string }>
  updateSolanaForLedgerWallet: (
    options: WalletUpdateSolanaOptions
  ) => Promise<void>
  updateLedgerWallet: (
    options: WalletUpdateOptions & LedgerKeys
  ) => Promise<{ walletId: string; accountId: string }>
}

export function useLedgerWallet(): UseLedgerWalletReturn {
  const { setLedgerWalletMap } = useLedgerWalletMap()
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
      await LedgerService.ensureConnection(deviceId)
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

        if (!bitcoinAddress) {
          throw new Error('Missing Bitcoin address for wallet creation')
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
          pvm: addresses.pvm,
          coreEth: addresses.coreEth?.startsWith('0x0x')
            ? addresses.coreEth.slice(2) // Remove first 0x to fix double prefix
            : addresses.coreEth
        }

        // Store the Ledger wallet with the specified derivation path type
        // For BIP44, store xpub in per-account format for future account additions
        await dispatch(
          storeWallet({
            walletId: newWalletId,
            name: `Ledger ${deviceName}`,
            walletSecret: JSON.stringify({
              deviceId,
              deviceName,
              derivationPathSpec: derivationPathType,
              ...(derivationPathType === LedgerDerivationPathType.BIP44 && {
                // Store in per-account format: { [accountIndex]: { evm, avalanche } }
                // This supports storing xpubs for additional accounts later
                extendedPublicKeys: {
                  0: {
                    evm: xpubs.evm, // Store base58 xpub for derivation
                    avalanche: xpubs.avalanche // Store base58 xpub for derivation
                  }
                }
              })
            }),
            type:
              derivationPathType === LedgerDerivationPathType.BIP44
                ? WalletType.LEDGER
                : WalletType.LEDGER_LIVE
          })
        ).unwrap()

        setLedgerWalletMap(
          newWalletId,
          { id: deviceId, name: deviceName || 'Ledger Device' },
          derivationPathType
        )

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
          addressBTC: bitcoinAddress,
          addressAVM: formattedAddresses.avm,
          addressPVM: formattedAddresses.pvm,
          addressSVM: solanaKeys[0]?.key || '',
          addressCoreEth: formattedAddresses.coreEth
        }

        dispatch(setAccount(newAccount))
        dispatch(setActiveAccountId(newAccountId))

        Logger.info('Ledger wallet created successfully:', newWalletId)
        showSnackbar('Ledger wallet created successfully!')
        return { walletId: newWalletId, accountId: newAccountId }
      } catch (error) {
        Logger.error('Failed to create Ledger wallet:', error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [dispatch]
  )

  const updateLedgerWallet = useCallback(
    async ({
      deviceId,
      walletId,
      walletName,
      walletType,
      accountIndexToUse,
      avalancheKeys,
      solanaKeys = [],
      bitcoinAddress
    }: WalletUpdateOptions & LedgerKeys) => {
      try {
        setIsLoading(true)

        if (!avalancheKeys) {
          throw new Error('Missing Avalanche keys for account creation')
        }

        if (!bitcoinAddress) {
          throw new Error('Missing Bitcoin address for account creation')
        }

        // Use addresses for display and xpubs for wallet functionality
        const { addresses, xpubs } = avalancheKeys

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

        // Update the Ledger wallet extended public keys for new account
        await dispatch(
          storeWallet({
            walletId,
            name: walletName,
            type: walletType,
            walletSecret: JSON.stringify({
              ...parsedWalletSecret,
              // For BIP44, update the extended public keys for account index
              ...(parsedWalletSecret.derivationPathSpec ===
                LedgerDerivationPathType.BIP44 && {
                extendedPublicKeys: {
                  ...parsedWalletSecret.extendedPublicKeys,
                  [accountIndexToUse]: {
                    evm: xpubs.evm, // Update with new xpub from getAvalancheKeys
                    avalanche: xpubs.avalanche // Update with new xpub from getAvalancheKeys
                  }
                }
              })
            })
          })
        ).unwrap()

        const newAccountId = uuid()
        const updatedAccount: PrimaryAccount = {
          id: newAccountId,
          walletId,
          name: `Account ${accountIndexToUse + 1}`,
          type: CoreAccountType.PRIMARY,
          index: accountIndexToUse,
          addressC: addresses.evm,
          addressCoreEth: addresses.coreEth,
          addressAVM: addresses.avm,
          addressPVM: addresses.pvm,
          addressBTC: bitcoinAddress,
          addressSVM: solanaKeys[0]?.key || ''
        }

        dispatch(setAccount(updatedAccount))
        dispatch(setActiveAccountId(newAccountId))

        Logger.info('Account created successfully')
        showSnackbar('Account created successfully!')
        return { walletId, accountId: newAccountId }
      } catch (error) {
        Logger.error('Failed to create account:', error)
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
      account,
      solanaKeys = []
    }: WalletUpdateSolanaOptions) => {
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
    updateSolanaForLedgerWallet,
    updateLedgerWallet
  }
}
