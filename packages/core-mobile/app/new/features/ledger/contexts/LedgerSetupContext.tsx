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
  LedgerTransportState
} from 'services/ledger/types'
import { useLedgerWallet } from '../hooks/useLedgerWallet'

interface LedgerSetupContextValue {
  // State values
  selectedDerivationPath: LedgerDerivationPathType | null
  connectedDeviceId: string | null
  connectedDeviceName: string
  isUpdatingWallet: boolean

  // State setters
  setSelectedDerivationPath: (path: LedgerDerivationPathType) => void
  setIsUpdatingWallet: (creating: boolean) => void

  // Ledger wallet hook values
  isConnecting: boolean
  transportState: LedgerTransportState
  connectToDevice: (deviceId: string, deviceName?: string) => Promise<void>
  disconnectDevice: () => Promise<void>
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
  const [isUpdatingWallet, setIsUpdatingWallet] = useState<boolean>(false)

  const { isConnecting, transportState, connectToDevice, disconnectDevice } =
    useLedgerWallet()

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
    setIsUpdatingWallet(false)
  }, [])

  const handleConnectToDevice = useCallback(
    async (deviceId: string, deviceName?: string) => {
      await connectToDevice(deviceId)
      handleSetConnectedDevice(deviceId, deviceName || 'Ledger Device')
    },
    [connectToDevice, handleSetConnectedDevice]
  )

  const handleDisconnectDevice = useCallback(async () => {
    await disconnectDevice()
    resetSetup()
  }, [disconnectDevice, resetSetup])

  const contextValue: LedgerSetupContextValue = useMemo(
    () => ({
      selectedDerivationPath,
      connectedDeviceId,
      connectedDeviceName,
      isUpdatingWallet,
      isConnecting,
      transportState,
      connectToDevice: handleConnectToDevice,
      disconnectDevice: handleDisconnectDevice,
      setSelectedDerivationPath,
      setIsUpdatingWallet,
      resetSetup
    }),
    [
      selectedDerivationPath,
      connectedDeviceId,
      connectedDeviceName,
      isUpdatingWallet,
      isConnecting,
      transportState,
      handleConnectToDevice,
      handleDisconnectDevice,
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
