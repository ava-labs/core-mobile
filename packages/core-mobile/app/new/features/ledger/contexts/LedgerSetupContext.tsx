import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode
} from 'react'
import { LedgerDerivationPathType } from 'services/wallet/LedgerWallet'
import {
  WalletCreationOptions,
  useLedgerWallet
} from '../hooks/useLedgerWallet'

interface LedgerSetupState {
  selectedDerivationPath: LedgerDerivationPathType | null
  connectedDeviceId: string | null
  connectedDeviceName: string
  isCreatingWallet: boolean
  hasStartedSetup: boolean
}

interface LedgerSetupContextValue extends LedgerSetupState {
  // State setters
  setSelectedDerivationPath: (path: LedgerDerivationPathType) => void
  setConnectedDevice: (deviceId: string, deviceName: string) => void
  setIsCreatingWallet: (creating: boolean) => void
  setHasStartedSetup: (started: boolean) => void

  // Ledger wallet hook values
  devices: any[]
  isScanning: boolean
  isConnecting: boolean
  transportState: unknown
  scanForDevices: () => void
  connectToDevice: (deviceId: string) => Promise<void>
  disconnectDevice: () => Promise<void>
  getSolanaKeys: () => Promise<void>
  getAvalancheKeys: () => Promise<void>
  createLedgerWallet: (options: WalletCreationOptions) => Promise<string>
  setupProgress: any
  keys: any

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
  const [state, setState] = useState<LedgerSetupState>({
    selectedDerivationPath: null,
    connectedDeviceId: null,
    connectedDeviceName: 'Ledger Device',
    isCreatingWallet: false,
    hasStartedSetup: false
  })

  // Use the existing ledger wallet hook
  const ledgerWallet = useLedgerWallet()

  const setSelectedDerivationPath = useCallback(
    (path: LedgerDerivationPathType) => {
      setState(prev => ({ ...prev, selectedDerivationPath: path }))
    },
    []
  )

  const setConnectedDevice = useCallback(
    (deviceId: string, deviceName: string) => {
      setState(prev => ({
        ...prev,
        connectedDeviceId: deviceId,
        connectedDeviceName: deviceName
      }))
    },
    []
  )

  const setIsCreatingWallet = useCallback((creating: boolean) => {
    setState(prev => ({ ...prev, isCreatingWallet: creating }))
  }, [])

  const setHasStartedSetup = useCallback((started: boolean) => {
    setState(prev => ({ ...prev, hasStartedSetup: started }))
  }, [])

  const resetSetup = useCallback(() => {
    setState({
      selectedDerivationPath: null,
      connectedDeviceId: null,
      connectedDeviceName: 'Ledger Device',
      isCreatingWallet: false,
      hasStartedSetup: false
    })
  }, [])

  const contextValue: LedgerSetupContextValue = useMemo(
    () => ({
      ...state,
      ...ledgerWallet,
      setSelectedDerivationPath,
      setConnectedDevice,
      setIsCreatingWallet,
      setHasStartedSetup,
      resetSetup
    }),
    [
      state,
      ledgerWallet,
      setSelectedDerivationPath,
      setConnectedDevice,
      setIsCreatingWallet,
      setHasStartedSetup,
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
