import { useState, useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Alert } from 'react-native'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import LedgerService from 'services/ledger/LedgerService'
import { LedgerDerivationPathType } from 'services/ledger/types'
import { WalletType } from 'services/wallet/types'
import { AppThunkDispatch } from 'store/types'
import { storeWallet } from 'store/wallet/thunks'
import { setActiveWallet } from 'store/wallet/slice'
import { setAccount, setActiveAccount, selectAccounts } from 'store/account'
import { showSnackbar } from 'new/common/utils/toast'
import { uuid } from 'utils/uuid'
import Logger from 'utils/Logger'
import { Curve } from 'utils/publicKeys'
import {
  WalletCreationOptions,
  LedgerTransportState
} from 'services/ledger/types'
import AccountsService from 'services/account/AccountsService'
import { DERIVATION_PATHS } from '../consts'

export interface UseLedgerWalletReturn {
  // Connection state
  isConnecting: boolean
  isLoading: boolean
  transportState: LedgerTransportState

  // Methods
  connectToDevice: (deviceId: string) => Promise<void>
  disconnectDevice: () => Promise<void>
  createLedgerWallet: (options: WalletCreationOptions & {
    avalancheKeys?: { evm: string; avalanche: string; pvm: string }
    solanaKeys?: Array<{ key: string; derivationPath: string; curve: string }>
  }) => Promise<string>
}

export function useLedgerWallet(): UseLedgerWalletReturn {
  const dispatch = useDispatch<AppThunkDispatch>()
  const allAccounts = useSelector(selectAccounts)
  const [transportState, setTransportState] = useState<LedgerTransportState>({
    available: false,
    powered: false
  })
  const [isConnecting, setIsConnecting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Monitor BLE transport state
  useEffect(() => {
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
  }, [])

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
      solanaKeys = []
    }: WalletCreationOptions & {
      avalancheKeys?: { evm: string; avalanche: string; pvm: string }
      solanaKeys?: Array<{ key: string; derivationPath: string; curve: string }>
    }) => {
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

        // Fix key formatting - remove double 0x prefixes that cause VM module errors
        const formattedAvalancheKeys = {
          evm: avalancheKeys.evm?.startsWith('0x0x')
            ? avalancheKeys.evm.slice(2) // Remove first 0x to fix double prefix
            : avalancheKeys.evm,
          avalanche: avalancheKeys.avalanche,
          pvm: avalancheKeys.pvm || avalancheKeys.avalanche
        }

        // Also fix the public keys array to ensure no double prefixes in storage
        const formattedPublicKeys = individualKeys.map(key => ({
          ...key,
          key: key.key?.startsWith('0x0x') ? key.key.slice(2) : key.key
        }))

        // Create the public keys array for BIP44
        const publicKeysToStore = [
          // Use formatted keys for BIP44
          {
            key: formattedAvalancheKeys.evm, // Use formatted key
            derivationPath: DERIVATION_PATHS.BIP44.EVM,
            curve: Curve.SECP256K1
          },
          {
            key: formattedAvalancheKeys.avalanche,
            derivationPath: DERIVATION_PATHS.BIP44.AVALANCHE,
            curve: Curve.SECP256K1
          },
          {
            key: formattedAvalancheKeys.pvm,
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
            walletName: `Ledger ${deviceName}`,
            walletSecret: JSON.stringify({
              deviceId,
              deviceName,
              derivationPath: DERIVATION_PATHS.BIP44.EVM,
              vmType: 'EVM',
              derivationPathSpec: derivationPathType,
              ...(derivationPathType === LedgerDerivationPathType.BIP44 && {
                extendedPublicKeys: {
                  evm: formattedAvalancheKeys.evm, // Use formatted key
                  avalanche: formattedAvalancheKeys.avalanche
                }
              }),
              publicKeys:
                derivationPathType === LedgerDerivationPathType.LedgerLive &&
                individualKeys.length > 0
                  ? formattedPublicKeys // Use formatted individual keys for Ledger Live
                  : publicKeysToStore, // Use the public keys we just created
              avalancheKeys: formattedAvalancheKeys, // Use formatted keys
              solanaKeys
            }),
            type:
              derivationPathType === LedgerDerivationPathType.BIP44
                ? WalletType.LEDGER
                : WalletType.LEDGER_LIVE
          })
        ).unwrap()

        dispatch(setActiveWallet(newWalletId))

        const newAccount = await AccountsService.createNextAccount({
          index: 0,
          walletType:
            derivationPathType === LedgerDerivationPathType.BIP44
              ? WalletType.LEDGER
              : WalletType.LEDGER_LIVE,
          isTestnet: false, // TODO: Get from settings
          walletId: newWalletId,
          name: `Account ${Object.keys(allAccounts).length + 1}`
        })

        dispatch(setAccount(newAccount))
        dispatch(setActiveAccount(newAccount.id))

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
    [dispatch, allAccounts]
  )

  return {
    isConnecting,
    transportState,
    connectToDevice,
    disconnectDevice,
    isLoading,
    createLedgerWallet
  }
}
