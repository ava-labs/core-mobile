import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode
} from 'react'
import {
  LedgerDerivationPathType,
  WalletCreationOptions,
  LedgerTransportState,
  LedgerKeys,
  LedgerDevice
} from 'services/ledger/types'
import { useLedgerWallet } from '../hooks/useLedgerWallet'
import { useLedgerWalletMap } from '../store'

interface LedgerSetupContextValue {
  // State values
  selectedDerivationPath: LedgerDerivationPathType | null
  connectedDeviceId: string | null
  connectedDeviceName: string
  isCreatingWallet: boolean
  hasStartedSetup: boolean

  // State setters
  setSelectedDerivationPath: (path: LedgerDerivationPathType) => void
  setConnectedDevice: (deviceId: string, deviceName: string) => void
  setIsCreatingWallet: (creating: boolean) => void
  setHasStartedSetup: (started: boolean) => void

  // Ledger wallet hook values
  devices: LedgerDevice[]
  isScanning: boolean
  isConnecting: boolean
  transportState: LedgerTransportState
  connectToDevice: (deviceId: string) => Promise<void>
  disconnectDevice: () => Promise<void>
  createLedgerWallet: (
    options: WalletCreationOptions & LedgerKeys
  ) => Promise<string>

  // Helper methods
  resetSetup: () => void
}

const LedgerSetupContext = createContext<LedgerSetupContextValue | null>(null)

interface LedgerSetupProviderProps {
  children: ReactNode
}

export const LedgerSetupProvider: React.FC<LedgerSetupProviderProps> = ({
  children
}) => {
  const [selectedDerivationPath, setSelectedDerivationPath] =
    useState<LedgerDerivationPathType | null>(null)
  const [connectedDeviceId, setConnectedDeviceId] = useState<string | null>(
    null
  )
  const [connectedDeviceName, setConnectedDeviceName] =
    useState<string>('Ledger Device')
  const [isCreatingWallet, setIsCreatingWallet] = useState<boolean>(false)
  const [hasStartedSetup, setHasStartedSetup] = useState<boolean>(false)

  const {
    devices,
    isConnecting,
    isScanning,
    transportState,
    connectToDevice,
    disconnectDevice,
    createLedgerWallet: _createLedgerWallet
  } = useLedgerWallet()

  const { setLedgerWalletMap } = useLedgerWalletMap()

  const createLedgerWallet = useCallback(
    async (options: WalletCreationOptions) => {
      const walletId = await _createLedgerWallet(options)
      setLedgerWalletMap(
        walletId,
        options.deviceId,
        options.deviceName || 'Ledger Device'
      )
      return walletId
    },
    [_createLedgerWallet, setLedgerWalletMap]
  )

  const handleSetConnectedDevice = useCallback(
    (deviceId: string, deviceName: string) => {
      setConnectedDeviceId(deviceId)
      setConnectedDeviceName(deviceName)
    },
    []
  )

  const resetSetup = useCallback(() => {
    setSelectedDerivationPath(null)
    setConnectedDeviceId(null)
    setConnectedDeviceName('Ledger Device')
    setIsCreatingWallet(false)
    setHasStartedSetup(false)
  }, [])

  const contextValue: LedgerSetupContextValue = useMemo(
    () => ({
      devices,
      selectedDerivationPath,
      connectedDeviceId,
      connectedDeviceName,
      isCreatingWallet,
      hasStartedSetup,
      isConnecting,
      isScanning,
      transportState,
      connectToDevice,
      disconnectDevice,
      createLedgerWallet,
      setSelectedDerivationPath,
      setConnectedDevice: handleSetConnectedDevice,
      setIsCreatingWallet,
      setHasStartedSetup,
      resetSetup
    }),
    [
      devices,
      selectedDerivationPath,
      connectedDeviceId,
      connectedDeviceName,
      isCreatingWallet,
      hasStartedSetup,
      isConnecting,
      isScanning,
      transportState,
      connectToDevice,
      disconnectDevice,
      createLedgerWallet,
      handleSetConnectedDevice,
      resetSetup
    ]
  )

  return (
    <LedgerSetupContext.Provider value={contextValue}>
      {children}
    </LedgerSetupContext.Provider>
  )
}

export const useLedgerSetupContext = (): LedgerSetupContextValue => {
  const context = useContext(LedgerSetupContext)
  if (!context) {
    throw new Error(
      'useLedgerSetupContext must be used within a LedgerSetupProvider'
    )
  }
  return context
}
