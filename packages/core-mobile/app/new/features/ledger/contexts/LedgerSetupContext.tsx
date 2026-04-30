import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode
} from 'react'
import { LedgerDerivationPathType } from 'services/ledger/types'
import LedgerService from 'services/ledger/LedgerService'
import { useLedgerAppStateListener } from '../hooks/useLedgerAppStateListener'

interface LedgerSetupContextValue {
  // State values
  selectedDerivationPath: LedgerDerivationPathType | null
  connectedDeviceId: string | null
  connectedDeviceName: string
  isUpdatingWallet: boolean

  // State setters
  setSelectedDerivationPath: (path: LedgerDerivationPathType) => void
  setIsUpdatingWallet: (creating: boolean) => void

  // Connection state and actions
  isConnecting: boolean
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
    useState<string>('Ledger')
  const [isUpdatingWallet, setIsUpdatingWallet] = useState<boolean>(false)
  const [isConnecting, setIsConnecting] = useState<boolean>(false)

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
    setConnectedDeviceName('Ledger')
    setIsUpdatingWallet(false)
    setIsConnecting(false)
  }, [])

  const handleConnectToDevice = useCallback(
    async (deviceId: string, deviceName?: string) => {
      setIsConnecting(true)
      try {
        await LedgerService.connect(deviceId)
        handleSetConnectedDevice(deviceId, deviceName || 'Ledger')
      } finally {
        setIsConnecting(false)
      }
    },
    [handleSetConnectedDevice]
  )

  const handleDisconnectDevice = useCallback(async () => {
    try {
      await LedgerService.disconnect()
    } finally {
      resetSetup()
    }
  }, [resetSetup])

  const contextValue: LedgerSetupContextValue = useMemo(
    () => ({
      selectedDerivationPath,
      connectedDeviceId,
      connectedDeviceName,
      isUpdatingWallet,
      isConnecting,
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
      handleConnectToDevice,
      handleDisconnectDevice,
      resetSetup
    ]
  )

  // Release BLE on background during onboarding — before the wallet is
  // registered as Ledger, the signed-in layout's listener isn't active.
  useLedgerAppStateListener(connectedDeviceId !== null)

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
