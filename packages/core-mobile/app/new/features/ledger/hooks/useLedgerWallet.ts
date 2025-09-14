import { useState, useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Alert, Platform, PermissionsAndroid } from 'react-native'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import AppSolana from '@ledgerhq/hw-app-solana'
import bs58 from 'bs58'
import { LedgerService, LedgerAppType } from 'services/ledger/ledgerService'
import { LedgerDerivationPathType } from 'services/wallet/LedgerWallet'
import { ChainName } from 'services/network/consts'
import { WalletType } from 'services/wallet/types'
import { AppThunkDispatch } from 'store/types'
import { storeWallet } from 'store/wallet/thunks'
import { setActiveWallet } from 'store/wallet/slice'
import { setAccount, setActiveAccount, selectAccounts } from 'store/account'
import { Account } from 'store/account/types'
import { CoreAccountType } from '@avalabs/types'
import { showSnackbar } from 'new/common/utils/toast'
import { uuid } from 'utils/uuid'
import Logger from 'utils/Logger'

export interface LedgerDevice {
  id: string
  name: string
  rssi?: number
}

export interface LedgerTransportState {
  available: boolean
  powered: boolean
}

export interface LedgerKeys {
  solanaKeys: any[]
  avalancheKeys: {
    evm: { key: string; address: string }
    avalanche: { key: string; address: string }
    pvm?: { key: string; address: string }
  } | null
  bitcoinAddress: string
  xpAddress: string
}

export interface WalletCreationOptions {
  deviceId: string
  deviceName?: string
  derivationPathType: LedgerDerivationPathType
  accountCount?: number
  individualKeys?: any[] // For Ledger Live - individual keys retrieved from device
  progressCallback?: (
    step: string,
    progress: number,
    totalSteps: number
  ) => void
}

export interface SetupProgress {
  currentStep: string
  progress: number
  totalSteps: number
  estimatedTimeRemaining?: number
}

export interface UseLedgerWalletReturn {
  // Device scanning and connection
  devices: LedgerDevice[]
  isScanning: boolean
  isConnecting: boolean
  transportState: LedgerTransportState
  scanForDevices: () => Promise<void>
  connectToDevice: (deviceId: string) => Promise<void>
  disconnectDevice: () => Promise<void>

  // Key retrieval
  isLoading: boolean
  getSolanaKeys: () => Promise<void>
  getAvalancheKeys: () => Promise<void>
  getLedgerLiveKeys: (
    accountCount?: number,
    progressCallback?: (
      step: string,
      progress: number,
      totalSteps: number
    ) => void
  ) => Promise<{ avalancheKeys: any; individualKeys: any[] }>
  resetKeys: () => void
  keys: LedgerKeys

  // Wallet creation
  createLedgerWallet: (options: WalletCreationOptions) => Promise<string> // Returns the new wallet ID

  // Setup progress
  setupProgress: SetupProgress | null
}

export function useLedgerWallet(): UseLedgerWalletReturn {
  const dispatch = useDispatch<AppThunkDispatch>()
  const allAccounts = useSelector(selectAccounts)
  const [ledgerService] = useState(() => new LedgerService())
  const [transportState, setTransportState] = useState<LedgerTransportState>({
    available: false,
    powered: false
  })
  const [devices, setDevices] = useState<LedgerDevice[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [setupProgress, setSetupProgress] = useState<SetupProgress | null>(null)

  // Key states
  const [solanaKeys, setSolanaKeys] = useState<any[]>([])
  const [avalancheKeys, setAvalancheKeys] = useState<any>(null)
  const [bitcoinAddress, setBitcoinAddress] = useState<string>('')
  const [xpAddress, setXpAddress] = useState<string>('')

  // Monitor BLE transport state
  useEffect(() => {
    const subscription = TransportBLE.observeState({
      next: event => {
        setTransportState({
          available: event.available,
          powered: false
        })
      },
      error: error => {
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

  // Request Bluetooth permissions
  const requestBluetoothPermissions = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        ].filter(Boolean) as any[]

        const granted = await PermissionsAndroid.requestMultiple(permissions)
        return Object.values(granted).every(
          permission => permission === 'granted'
        )
      } catch (err) {
        return false
      }
    }
    return true
  }, [])

  // Handle scan errors
  const handleScanError = useCallback((error: any) => {
    setIsScanning(false)

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
  }, [])

  // Scan for Ledger devices
  const scanForDevices = useCallback(async () => {
    if (!transportState.available) {
      Alert.alert(
        'Bluetooth Unavailable',
        'Please enable Bluetooth to scan for Ledger devices'
      )
      return
    }

    const hasPermissions = await requestBluetoothPermissions()
    if (!hasPermissions) {
      Alert.alert(
        'Permission Required',
        'Bluetooth permissions are required to scan for Ledger devices.'
      )
      return
    }

    setIsScanning(true)
    setDevices([])

    try {
      const subscription = TransportBLE.listen({
        next: event => {
          if (event.type === 'add') {
            const device: LedgerDevice = {
              id: event.descriptor.id,
              name: event.descriptor.name || 'Unknown Device',
              rssi: event.descriptor.rssi
            }

            setDevices(prev => {
              const exists = prev.find(d => d.id === device.id)
              if (!exists) {
                return [...prev, device]
              }
              return prev
            })
          }
        },
        error: handleScanError,
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        complete: () => {}
      })

      setTimeout(() => {
        subscription.unsubscribe()
        setIsScanning(false)
      }, 10000)
    } catch (error) {
      handleScanError(error)
    }
  }, [transportState.available, requestBluetoothPermissions, handleScanError])

  // Connect to device
  const connectToDevice = useCallback(
    async (deviceId: string) => {
      setIsConnecting(true)
      try {
        await ledgerService.connect(deviceId)
        Logger.info('Connected to Ledger device')
      } catch (error) {
        Logger.error('Failed to connect to device', error)
        throw error
      } finally {
        setIsConnecting(false)
      }
    },
    [ledgerService]
  )

  // Disconnect device
  const disconnectDevice = useCallback(async () => {
    try {
      await ledgerService.disconnect()
      Logger.info('Disconnected from Ledger device')
    } catch (error) {
      Logger.error('Failed to disconnect', error)
      throw error
    }
  }, [ledgerService])

  // Get Solana keys
  const getSolanaKeys = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isLoading) {
      Logger.info('Solana key retrieval already in progress, skipping')
      return
    }

    try {
      setIsLoading(true)
      Logger.info('Getting Solana keys with passive app detection')

      await ledgerService.waitForApp(LedgerAppType.SOLANA)

      // Get address directly from Solana app
      const solanaApp = new AppSolana(ledgerService.getTransport())
      const derivationPath = `44'/501'/0'/0'/0`
      const result = await solanaApp.getAddress(derivationPath, false)

      // Convert the Buffer to base58 format (Solana address format)
      const solanaAddress = bs58.encode(new Uint8Array(result.address))

      setSolanaKeys([
        {
          key: solanaAddress,
          derivationPath,
          curve: 'ed25519',
          publicKey: solanaAddress
        }
      ])
      Logger.info('Successfully got Solana address', solanaAddress)
    } catch (error) {
      Logger.error('Failed to get Solana keys', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, ledgerService])

  // Get Avalanche keys
  const getAvalancheKeys = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isLoading) {
      Logger.info('Avalanche key retrieval already in progress, skipping')
      return
    }

    try {
      setIsLoading(true)
      Logger.info('Getting Avalanche keys')

      const addresses = await ledgerService.getAllAddresses(0, 1)

      const evmAddress =
        addresses.find(addr => addr.network === ChainName.AVALANCHE_C_EVM)
          ?.address || ''
      const xpAddress =
        addresses.find(addr => addr.network === ChainName.AVALANCHE_X)
          ?.address || ''
      const pvmAddress =
        addresses.find(addr => addr.network === ChainName.AVALANCHE_P)
          ?.address || ''
      const btcAddress =
        addresses.find(addr => addr.network === ChainName.BITCOIN)?.address ||
        ''

      // Store the addresses directly from the device
      setAvalancheKeys({
        evm: { key: evmAddress, address: evmAddress },
        avalanche: { key: xpAddress, address: xpAddress },
        pvm: { key: pvmAddress, address: pvmAddress }
      })
      setBitcoinAddress(btcAddress)
      setXpAddress(xpAddress)

      Logger.info('Successfully got Avalanche keys')
    } catch (error) {
      Logger.error('Failed to get Avalanche keys', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, ledgerService])

  const resetKeys = useCallback(() => {
    setSolanaKeys([])
    setAvalancheKeys(null)
    setBitcoinAddress('')
    setXpAddress('')
  }, [])

  // New method: Get individual keys for Ledger Live (sequential device confirmations)
  const getLedgerLiveKeys = useCallback(
    async (
      accountCount = 3,
      progressCallback?: (
        step: string,
        progress: number,
        totalSteps: number
      ) => void
    ) => {
      try {
        setIsLoading(true)
        Logger.info(
          `Starting Ledger Live key retrieval for ${accountCount} accounts`
        )

        const totalSteps = accountCount // One step per account (gets both EVM and AVM)
        const individualKeys: any[] = []
        let avalancheKeysResult: any = null

        // Sequential address retrieval - each account requires device confirmation
        for (
          let accountIndex = 0;
          accountIndex < accountCount;
          accountIndex++
        ) {
          const stepName = `Getting keys for account ${accountIndex + 1}...`
          const progress = Math.round(((accountIndex + 1) / totalSteps) * 100)
          progressCallback?.(stepName, progress, totalSteps)

          Logger.info(
            `Requesting addresses for account ${accountIndex} (Ledger Live style)`
          )

          // Get public keys for this specific account (1 at a time for device confirmation)
          const publicKeys = await ledgerService.getPublicKeys(accountIndex, 1)

          // Also get addresses for display purposes
          const addresses = await ledgerService.getAllAddresses(accountIndex, 1)

          // Extract the keys for this account
          const evmPublicKey = publicKeys.find(key =>
            key.derivationPath.includes("44'/60'")
          )
          const avmPublicKey = publicKeys.find(key =>
            key.derivationPath.includes("44'/9000'")
          )

          // Extract addresses for this account
          const evmAddress = addresses.find(
            addr => addr.network === ChainName.AVALANCHE_C_EVM
          )
          const xpAddress = addresses.find(
            addr => addr.network === ChainName.AVALANCHE_X
          )

          if (evmPublicKey) {
            individualKeys.push({
              key: evmPublicKey.key,
              derivationPath: `m/44'/60'/${accountIndex}'/0/0`, // Ledger Live path
              curve: evmPublicKey.curve
            })
          }

          if (avmPublicKey) {
            individualKeys.push({
              key: avmPublicKey.key,
              derivationPath: `m/44'/9000'/${accountIndex}'/0/0`, // Ledger Live path
              curve: avmPublicKey.curve
            })
          }

          // Store first account's keys as primary
          if (accountIndex === 0) {
            avalancheKeysResult = {
              evm: {
                key: evmPublicKey?.key || '',
                address: evmAddress?.address || ''
              },
              avalanche: {
                key: avmPublicKey?.key || '',
                address: xpAddress?.address || ''
              }
            }
          }
        }

        // Update state with the retrieved keys
        if (avalancheKeysResult) {
          setAvalancheKeys(avalancheKeysResult)
        }

        Logger.info(
          `Successfully retrieved Ledger Live keys for ${accountCount} accounts`
        )
        Logger.info('Individual keys count:', individualKeys.length)

        return { avalancheKeys: avalancheKeysResult, individualKeys }
      } catch (error) {
        Logger.error('Failed to get Ledger Live keys:', error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [ledgerService]
  )

  const createLedgerWallet = useCallback(
    async ({
      deviceId,
      deviceName = 'Ledger Device',
      derivationPathType = LedgerDerivationPathType.BIP44,
      accountCount = derivationPathType === LedgerDerivationPathType.BIP44
        ? 3
        : 1,
      individualKeys = [],
      progressCallback
    }: WalletCreationOptions) => {
      try {
        setIsLoading(true)

        // Initialize progress tracking
        const totalSteps =
          derivationPathType === LedgerDerivationPathType.BIP44 ? 3 : 6
        let currentStep = 1

        const updateProgress = (stepName: string) => {
          const progress = {
            currentStep: stepName,
            progress: Math.round((currentStep / totalSteps) * 100),
            totalSteps,
            estimatedTimeRemaining:
              (totalSteps - currentStep) *
              (derivationPathType === LedgerDerivationPathType.BIP44 ? 5 : 8)
          }
          setSetupProgress(progress)
          progressCallback?.(stepName, progress.progress, totalSteps)
          currentStep++
        }

        updateProgress('Validating keys...')
        Logger.info(
          `Creating ${derivationPathType} Ledger wallet with generated keys...`
        )

        if (!avalancheKeys || solanaKeys.length === 0 || !bitcoinAddress) {
          throw new Error('Missing required keys for wallet creation')
        }

        updateProgress('Generating wallet ID...')
        const newWalletId = uuid()

        updateProgress('Storing wallet data...')
        // Store the Ledger wallet with the specified derivation path type
        await dispatch(
          storeWallet({
            walletId: newWalletId,
            walletSecret: JSON.stringify({
              deviceId,
              deviceName,
              derivationPath: "m/44'/60'/0'/0/0",
              vmType: 'EVM',
              derivationPathSpec: derivationPathType,
              ...(derivationPathType === LedgerDerivationPathType.BIP44 && {
                extendedPublicKeys: {
                  evm: avalancheKeys.evm.key,
                  avalanche: avalancheKeys.avalanche.key
                }
              }),
              publicKeys:
                derivationPathType === LedgerDerivationPathType.LedgerLive &&
                individualKeys.length > 0
                  ? individualKeys // Use individual keys for Ledger Live
                  : [
                      // Use existing keys for BIP44
                      {
                        key: avalancheKeys.evm.key,
                        derivationPath: "m/44'/60'/0'/0/0",
                        curve: 'secp256k1'
                      },
                      {
                        key: avalancheKeys.avalanche.key,
                        derivationPath: "m/44'/9000'/0'/0/0",
                        curve: 'secp256k1'
                      },
                      {
                        key:
                          avalancheKeys.pvm?.key || avalancheKeys.avalanche.key,
                        derivationPath: "m/44'/9000'/0'/0/0",
                        curve: 'secp256k1'
                      },
                      {
                        key: solanaKeys[0]?.key || '',
                        derivationPath: "m/44'/501'/0'/0'",
                        curve: 'ed25519'
                      }
                    ],
              avalancheKeys,
              solanaKeys
            }),
            type: WalletType.LEDGER
          })
        ).unwrap()

        dispatch(setActiveWallet(newWalletId))

        // Create addresses from the keys
        const addresses = {
          EVM: avalancheKeys.evm.address,
          AVM: avalancheKeys.avalanche.address,
          PVM: avalancheKeys.pvm?.address || avalancheKeys.avalanche.address,
          BITCOIN: bitcoinAddress,
          SVM: solanaKeys[0]?.publicKey || '',
          CoreEth: ''
        }

        const newAccountId = uuid()
        const newAccount: Account = {
          id: newAccountId,
          walletId: newWalletId,
          name: `Account ${Object.keys(allAccounts).length + 1}`,
          type: CoreAccountType.PRIMARY,
          index: 0,
          addressC: addresses.EVM,
          addressBTC: addresses.BITCOIN,
          addressAVM: addresses.AVM,
          addressPVM: addresses.PVM,
          addressSVM: addresses.SVM,
          addressCoreEth: addresses.CoreEth
        }

        dispatch(setAccount(newAccount))
        dispatch(setActiveAccount(newAccountId))

        Logger.info('Ledger wallet created successfully:', newWalletId)
        showSnackbar('Ledger wallet created successfully!')
        return newWalletId
      } catch (error) {
        Logger.error('Failed to create Ledger wallet:', error)
        throw error
      } finally {
        setIsLoading(false)
        setSetupProgress(null)
      }
    },
    [avalancheKeys, solanaKeys, bitcoinAddress, dispatch, allAccounts]
  )

  return {
    // Device scanning and connection
    devices,
    isScanning,
    isConnecting,
    transportState,
    scanForDevices,
    connectToDevice,
    disconnectDevice,

    // Key retrieval
    isLoading,
    getSolanaKeys,
    getAvalancheKeys,
    getLedgerLiveKeys,
    resetKeys,
    keys: {
      solanaKeys,
      avalancheKeys,
      bitcoinAddress,
      xpAddress
    },

    // Wallet creation
    createLedgerWallet,

    // Setup progress
    setupProgress
  }
}
