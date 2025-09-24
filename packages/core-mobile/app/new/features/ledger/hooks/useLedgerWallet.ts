import { CoreAccountType } from '@avalabs/types'
import AppSolana from '@ledgerhq/hw-app-solana'
import Transport from '@ledgerhq/hw-transport'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import bs58 from 'bs58'
import { showSnackbar } from 'new/common/utils/toast'
import { useCallback, useEffect, useState } from 'react'
import { Alert, PermissionsAndroid, Platform } from 'react-native'
import { useDispatch } from 'react-redux'
import LedgerService from 'services/ledger/LedgerService'
import {
  LedgerAppType,
  LedgerDerivationPathType,
  LedgerDevice,
  LedgerKeys,
  LedgerTransportState,
  SetupProgress,
  WalletCreationOptions
} from 'services/ledger/types'
import { ChainName } from 'services/network/consts'
import { WalletType } from 'services/wallet/types'
import { setAccount, setActiveAccount } from 'store/account'
import { Account } from 'store/account/types'
import { AppThunkDispatch } from 'store/types'
import { setActiveWallet } from 'store/wallet/slice'
import { storeWallet } from 'store/wallet/thunks'
import Logger from 'utils/Logger'
<<<<<<< HEAD
import { Curve } from 'utils/publicKeys'
import { uuid } from 'utils/uuid'
import {
  DERIVATION_PATHS,
  LEDGER_TIMEOUTS,
  SOLANA_DERIVATION_PATH
} from '../consts'

export interface UseLedgerWalletReturn {
  // Connection state
  devices: LedgerDevice[]
  isScanning: boolean
  isConnecting: boolean
  isLoading: boolean
  setupProgress: SetupProgress | null
  transportState: LedgerTransportState

  // Key states and methods
  keys: {
    solanaKeys: Array<{
      key: string
      derivationPath: string
      curve: Curve
    }>
    avalancheKeys: {
      evm: string
      avalanche: string
      pvm: string
    } | null
    bitcoinAddress: string
    xpAddress: string
  }

  // Methods
  scanForDevices: () => Promise<void>
  connectToDevice: (deviceId: string) => Promise<void>
  disconnectDevice: () => Promise<void>
  getSolanaKeys: () => Promise<void>
  getAvalancheKeys: () => Promise<void>
  getLedgerLiveKeys: (
    accountCount?: number,
    progressCallback?: (
      step: string,
      progress: number,
      totalSteps: number
    ) => void
  ) => Promise<{
    avalancheKeys: { evm: string; avalanche: string; pvm: string } | null
    individualKeys: Array<{ key: string; derivationPath: string; curve: Curve }>
  }>
  resetKeys: () => void
  createLedgerWallet: (options: WalletCreationOptions) => Promise<string>
}

export function useLedgerWallet(): UseLedgerWalletReturn {
  const dispatch = useDispatch<AppThunkDispatch>()
  const [transportState, setTransportState] = useState<LedgerTransportState>({
    available: false,
    powered: false
  })
  const [devices, setDevices] = useState<LedgerDevice[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
<<<<<<< HEAD
<<<<<<< HEAD
  const [setupProgress, setSetupProgress] = useState<SetupProgress | null>(null)

  // Key states
  const [solanaKeys, setSolanaKeys] = useState<LedgerKeys['solanaKeys']>([])
  const [avalancheKeys, setAvalancheKeys] =
    useState<LedgerKeys['avalancheKeys']>(null)
=======
=======
  const [setupProgress, setSetupProgress] = useState<SetupProgress | null>(null)
>>>>>>> 6a596f952 (ledger live address derivation working, transactiosn on avalanche and solana proven with this setup)

  // Key states
  const [solanaKeys, setSolanaKeys] = useState<any[]>([])
  const [avalancheKeys, setAvalancheKeys] = useState<any>(null)
>>>>>>> 0070815a2 (ledger provider, modifications to wallet, ui now using hook)
  const [bitcoinAddress, setBitcoinAddress] = useState<string>('')
  const [xpAddress, setXpAddress] = useState<string>('')

  // Monitor BLE transport state
  useEffect(() => {
    const subscription = TransportBLE.observeState({
<<<<<<< HEAD
      next: (event: { available: boolean }) => {
=======
      next: event => {
>>>>>>> 0070815a2 (ledger provider, modifications to wallet, ui now using hook)
        setTransportState({
          available: event.available,
          powered: false
        })
      },
<<<<<<< HEAD
      error: (error: Error) => {
=======
      error: error => {
>>>>>>> 0070815a2 (ledger provider, modifications to wallet, ui now using hook)
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
<<<<<<< HEAD
        ].filter(Boolean)
=======
        ].filter(Boolean) as any[]
>>>>>>> 0070815a2 (ledger provider, modifications to wallet, ui now using hook)

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
<<<<<<< HEAD
  const handleScanError = useCallback((error: Error) => {
=======
  const handleScanError = useCallback((error: any) => {
>>>>>>> 0070815a2 (ledger provider, modifications to wallet, ui now using hook)
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
<<<<<<< HEAD
        next: (event: {
          type: string
          descriptor: { id: string; name?: string; rssi?: number }
        }) => {
=======
        next: event => {
>>>>>>> 0070815a2 (ledger provider, modifications to wallet, ui now using hook)
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
<<<<<<< HEAD
      }, LEDGER_TIMEOUTS.SCAN_TIMEOUT)
    } catch (error) {
      handleScanError(error as Error)
=======
      }, 10000)
    } catch (error) {
      handleScanError(error)
>>>>>>> 0070815a2 (ledger provider, modifications to wallet, ui now using hook)
    }
  }, [transportState.available, requestBluetoothPermissions, handleScanError])

  // Connect to device
<<<<<<< HEAD
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
=======
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
>>>>>>> 0070815a2 (ledger provider, modifications to wallet, ui now using hook)

  // Disconnect device
  const disconnectDevice = useCallback(async () => {
    try {
<<<<<<< HEAD
      await LedgerService.disconnect()
=======
      await ledgerService.disconnect()
>>>>>>> 0070815a2 (ledger provider, modifications to wallet, ui now using hook)
      Logger.info('Disconnected from Ledger device')
    } catch (error) {
      Logger.error('Failed to disconnect', error)
      throw error
    }
<<<<<<< HEAD
  }, [])

  // Get Solana keys
  const getSolanaKeys = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isLoading) {
      Logger.info('Solana key retrieval already in progress, skipping')
      return
    }

=======
  }, [ledgerService])

  // Get Solana keys
  const getSolanaKeys = useCallback(async () => {
>>>>>>> 0070815a2 (ledger provider, modifications to wallet, ui now using hook)
    try {
      setIsLoading(true)
      Logger.info('Getting Solana keys with passive app detection')

<<<<<<< HEAD
      await LedgerService.waitForApp(LedgerAppType.SOLANA)

      // Get address directly from Solana app
      const transport = await LedgerService.getTransport()
      const solanaApp = new AppSolana(transport as Transport)
      const derivationPath = SOLANA_DERIVATION_PATH
      const result = await solanaApp.getAddress(derivationPath, false)

      // Convert the Buffer to base58 format (Solana address format)
      const solanaAddress = bs58.encode(new Uint8Array(result.address))
=======
      await ledgerService.waitForApp(LedgerAppType.SOLANA)

      // Get address directly from Solana app
      const solanaApp = new AppSolana(ledgerService.getTransport())
      const derivationPath = `44'/501'/0'/0'/0`
      const result = await solanaApp.getAddress(derivationPath, false)

<<<<<<< HEAD
      // result.address is already in base58 format
      const solanaAddress = result.address.toString()
>>>>>>> 0070815a2 (ledger provider, modifications to wallet, ui now using hook)
=======
      // Convert the Buffer to base58 format (Solana address format)
      const solanaAddress = bs58.encode(new Uint8Array(result.address))
>>>>>>> 6a596f952 (ledger live address derivation working, transactiosn on avalanche and solana proven with this setup)

      setSolanaKeys([
        {
          key: solanaAddress,
          derivationPath,
<<<<<<< HEAD
          curve: Curve.ED25519
=======
          curve: 'ed25519',
          publicKey: solanaAddress
>>>>>>> 0070815a2 (ledger provider, modifications to wallet, ui now using hook)
        }
      ])
      Logger.info('Successfully got Solana address', solanaAddress)
    } catch (error) {
      Logger.error('Failed to get Solana keys', error)
      throw error
    } finally {
      setIsLoading(false)
    }
<<<<<<< HEAD
  }, [isLoading])

  // Get Avalanche keys
  const getAvalancheKeys = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isLoading) {
      Logger.info('Avalanche key retrieval already in progress, skipping')
      return
    }

=======
  }, [ledgerService])

  // Get Avalanche keys
  const getAvalancheKeys = useCallback(async () => {
>>>>>>> 0070815a2 (ledger provider, modifications to wallet, ui now using hook)
    try {
      setIsLoading(true)
      Logger.info('Getting Avalanche keys')

<<<<<<< HEAD
      const addresses = await LedgerService.getAllAddresses(0, 1)
=======
      const addresses = await ledgerService.getAllAddresses(0, 1)
>>>>>>> 0070815a2 (ledger provider, modifications to wallet, ui now using hook)

      const evmAddress =
        addresses.find(addr => addr.network === ChainName.AVALANCHE_C_EVM)
          ?.address || ''
<<<<<<< HEAD
      const xChainAddress =
=======
      const xpAddress =
>>>>>>> 0070815a2 (ledger provider, modifications to wallet, ui now using hook)
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
<<<<<<< HEAD
        evm: evmAddress,
        avalanche: xChainAddress,
        pvm: pvmAddress
      })
      setBitcoinAddress(btcAddress)
      setXpAddress(xChainAddress)
=======
        evm: { key: evmAddress, address: evmAddress },
        avalanche: { key: xpAddress, address: xpAddress },
        pvm: { key: pvmAddress, address: pvmAddress }
      })
      setBitcoinAddress(btcAddress)
      setXpAddress(xpAddress)
>>>>>>> 0070815a2 (ledger provider, modifications to wallet, ui now using hook)

      Logger.info('Successfully got Avalanche keys')
    } catch (error) {
      Logger.error('Failed to get Avalanche keys', error)
      throw error
    } finally {
      setIsLoading(false)
    }
<<<<<<< HEAD
  }, [isLoading])
=======
  }, [ledgerService])
>>>>>>> 0070815a2 (ledger provider, modifications to wallet, ui now using hook)

  const resetKeys = useCallback(() => {
    setSolanaKeys([])
    setAvalancheKeys(null)
    setBitcoinAddress('')
    setXpAddress('')
  }, [])

<<<<<<< HEAD
<<<<<<< HEAD
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
        const individualKeys: Array<{
          key: string
          derivationPath: string
          curve: Curve
        }> = []
        let avalancheKeysResult: LedgerKeys['avalancheKeys'] = null

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
          const publicKeys = await LedgerService.getPublicKeys(accountIndex, 1)

          // Also get addresses for display purposes
          const addresses = await LedgerService.getAllAddresses(accountIndex, 1)

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
          const xChainAddr = addresses.find(
            addr => addr.network === ChainName.AVALANCHE_X
          )

          if (evmPublicKey) {
            individualKeys.push({
              key: evmPublicKey.key,
              derivationPath: DERIVATION_PATHS.LEDGER_LIVE.EVM(accountIndex),
              curve: evmPublicKey.curve as Curve
            })
          }

          if (avmPublicKey) {
            individualKeys.push({
              key: avmPublicKey.key,
              derivationPath:
                DERIVATION_PATHS.LEDGER_LIVE.AVALANCHE(accountIndex),
              curve: avmPublicKey.curve as Curve
            })
          }

          // Store first account's keys as primary
          if (accountIndex === 0) {
            avalancheKeysResult = {
              evm: evmAddress?.address || '',
              avalanche: xChainAddr?.address || '',
              pvm: '' // Will be set when PVM addresses are implemented
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
    []
  )

  const createLedgerWallet = useCallback(
    async ({
      deviceId,
      deviceName = 'Ledger Device',
      derivationPathType = LedgerDerivationPathType.BIP44,
      individualKeys = []
    }: WalletCreationOptions) => {
      try {
        setIsLoading(true)

        // Initialize progress tracking
        const totalSteps =
          derivationPathType === LedgerDerivationPathType.BIP44 ? 3 : 6
        let currentStep = 1

        const updateProgress = (stepName: string): void => {
          const progress = {
            currentStep: stepName,
            progress: Math.round((currentStep / totalSteps) * 100),
            totalSteps,
            estimatedTimeRemaining:
              (totalSteps - currentStep) *
              (derivationPathType === LedgerDerivationPathType.BIP44 ? 5 : 8)
          }
          setSetupProgress(progress)
          currentStep++
        }

        updateProgress('Validating keys...')
        Logger.info(
          `Creating ${derivationPathType} Ledger wallet with generated keys...`
        )
=======
=======
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

>>>>>>> 6a596f952 (ledger live address derivation working, transactiosn on avalanche and solana proven with this setup)
  const createLedgerWallet = useCallback(
    async ({
      deviceId,
      deviceName = 'Ledger Device',
      derivationPathType = LedgerDerivationPathType.BIP44,
      individualKeys = [],
      progressCallback
    }: WalletCreationOptions) => {
      try {
        setIsLoading(true)
<<<<<<< HEAD
        Logger.info('Creating Ledger wallet with generated keys...')
>>>>>>> 0070815a2 (ledger provider, modifications to wallet, ui now using hook)
=======

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
>>>>>>> 6a596f952 (ledger live address derivation working, transactiosn on avalanche and solana proven with this setup)

        if (!avalancheKeys) {
          throw new Error('Missing Avalanche keys for wallet creation')
        }
        if (solanaKeys.length === 0) {
          throw new Error('Missing Solana keys for wallet creation')
        }

<<<<<<< HEAD
<<<<<<< HEAD
        updateProgress('Generating wallet ID...')
        const newWalletId = uuid()

        updateProgress('Storing wallet data...')
        // Store the Ledger wallet with the specified derivation path type
=======
        const newWalletId = uuid()

        // Store the Ledger wallet
>>>>>>> 0070815a2 (ledger provider, modifications to wallet, ui now using hook)
=======
        updateProgress('Generating wallet ID...')
        const newWalletId = uuid()

        updateProgress('Storing wallet data...')
        // Store the Ledger wallet with the specified derivation path type
>>>>>>> 6a596f952 (ledger live address derivation working, transactiosn on avalanche and solana proven with this setup)
        await dispatch(
          storeWallet({
            walletId: newWalletId,
            walletSecret: JSON.stringify({
              deviceId,
              deviceName,
<<<<<<< HEAD
              derivationPath: DERIVATION_PATHS.BIP44.EVM,
              vmType: 'EVM',
              derivationPathSpec: derivationPathType,
              ...(derivationPathType === LedgerDerivationPathType.BIP44 && {
                extendedPublicKeys: {
                  evm: avalancheKeys.evm,
                  avalanche: avalancheKeys.avalanche
                }
              }),
              publicKeys:
                derivationPathType === LedgerDerivationPathType.LedgerLive &&
                individualKeys.length > 0
                  ? individualKeys // Use individual keys for Ledger Live
                  : [
                      // Use existing keys for BIP44
                      {
                        key: avalancheKeys.evm,
                        derivationPath: DERIVATION_PATHS.BIP44.EVM,
                        curve: Curve.SECP256K1
                      },
                      {
                        key: avalancheKeys.avalanche,
                        derivationPath: DERIVATION_PATHS.BIP44.AVALANCHE,
                        curve: Curve.SECP256K1
                      },
                      {
                        key: avalancheKeys.pvm || avalancheKeys.avalanche,
                        derivationPath: DERIVATION_PATHS.BIP44.PVM,
                        curve: Curve.SECP256K1
                      },
                      {
                        key: solanaKeys[0]?.key || '',
                        derivationPath: DERIVATION_PATHS.BIP44.SOLANA,
                        curve: Curve.ED25519
                      }
                    ],
              avalancheKeys,
              solanaKeys
            }),
            type:
              derivationPathType === LedgerDerivationPathType.BIP44
                ? WalletType.LEDGER
                : WalletType.LEDGER_LIVE
=======
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
>>>>>>> 0070815a2 (ledger provider, modifications to wallet, ui now using hook)
          })
        ).unwrap()

        dispatch(setActiveWallet(newWalletId))

        // Create addresses from the keys
        const addresses = {
<<<<<<< HEAD
          EVM: avalancheKeys.evm,
          AVM: avalancheKeys.avalanche,
          PVM: avalancheKeys.pvm || avalancheKeys.avalanche,
          BITCOIN: bitcoinAddress,
          SVM: solanaKeys[0]?.key || '',
=======
          EVM: avalancheKeys.evm.address,
          AVM: avalancheKeys.avalanche.address,
          PVM: avalancheKeys.pvm?.address || avalancheKeys.avalanche.address,
          BITCOIN: bitcoinAddress,
          SVM: solanaKeys[0]?.publicKey || '',
>>>>>>> 0070815a2 (ledger provider, modifications to wallet, ui now using hook)
          CoreEth: ''
        }

        const newAccountId = uuid()
        const newAccount: Account = {
          id: newAccountId,
          walletId: newWalletId,
          name: `Account 1`,
          type: CoreAccountType.PRIMARY,
          index: 0,
          addressC: addresses.EVM,
          addressBTC: addresses.BITCOIN,
          addressAVM: addresses.AVM,
          addressPVM: addresses.PVM,
          addressSVM: addresses.SVM,
          addressCoreEth: addresses.CoreEth,
          xpAddresses: [], // TODO: add xp addresses,
          xpAddressDictionary: {},
          hasMigratedXpAddresses: true // TODO: true when xpAddresses are successfully fetched
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
<<<<<<< HEAD
<<<<<<< HEAD
        setSetupProgress(null)
=======
>>>>>>> 0070815a2 (ledger provider, modifications to wallet, ui now using hook)
=======
        setSetupProgress(null)
>>>>>>> 6a596f952 (ledger live address derivation working, transactiosn on avalanche and solana proven with this setup)
      }
    },
    [avalancheKeys, solanaKeys, bitcoinAddress, dispatch]
  )

  return {
<<<<<<< HEAD
=======
    // Device scanning and connection
>>>>>>> 0070815a2 (ledger provider, modifications to wallet, ui now using hook)
    devices,
    isScanning,
    isConnecting,
    transportState,
    scanForDevices,
    connectToDevice,
    disconnectDevice,
<<<<<<< HEAD
    isLoading,
    getSolanaKeys,
    getAvalancheKeys,
    getLedgerLiveKeys,
    resetKeys,
=======

    // Key retrieval
    isLoading,
    getSolanaKeys,
    getAvalancheKeys,
<<<<<<< HEAD
>>>>>>> 0070815a2 (ledger provider, modifications to wallet, ui now using hook)
=======
    getLedgerLiveKeys,
    resetKeys,
>>>>>>> 6a596f952 (ledger live address derivation working, transactiosn on avalanche and solana proven with this setup)
    keys: {
      solanaKeys,
      avalancheKeys,
      bitcoinAddress,
      xpAddress
    },
<<<<<<< HEAD
    createLedgerWallet,
    setupProgress
=======

    // Wallet creation
    createLedgerWallet,
<<<<<<< HEAD
    resetKeys
>>>>>>> 0070815a2 (ledger provider, modifications to wallet, ui now using hook)
=======

    // Setup progress
    setupProgress
>>>>>>> 6a596f952 (ledger live address derivation working, transactiosn on avalanche and solana proven with this setup)
  }
}

}

}
