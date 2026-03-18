import { LEDGER_DEVICE_BRIEF_DELAY_MS } from 'features/ledger/consts'
import { useLedgerWalletMap } from 'features/ledger/store'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import LedgerService from 'services/ledger/LedgerService'
import { LedgerAppType, LedgerDevice } from 'services/ledger/types'
import { selectActiveWalletId } from 'store/wallet/slice'

type UseLedgerBLEConnectionParams = {
  isLedger: boolean
  isConnecting: boolean
}

type UseLedgerBLEConnectionReturn = {
  isLedgerConnected: boolean
  isAvalancheAppOpen: boolean
  deviceForWallet: LedgerDevice | undefined
  handleReconnect: () => Promise<void>
  connectionStatus: string
}

export const useLedgerBLEConnection = ({
  isLedger,
  isConnecting
}: UseLedgerBLEConnectionParams): UseLedgerBLEConnectionReturn => {
  const [isLedgerConnected, setIsLedgerConnected] = useState(false)
  const [isAvalancheAppOpen, setIsAvalancheAppOpen] = useState(false)

  const isMountedRef = useRef(true)
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const activeWalletId = useSelector(selectActiveWalletId)
  const { getLedgerInfoByWalletId } = useLedgerWalletMap()
  const deviceForWallet = useMemo(
    () => getLedgerInfoByWalletId(activeWalletId)?.device,
    [getLedgerInfoByWalletId, activeWalletId]
  )

  // Reset connection state when a new connecting phase begins
  useEffect(() => {
    if (isConnecting) {
      setIsLedgerConnected(false)
      setIsAvalancheAppOpen(false)
    }
  }, [isConnecting])

  const handleReconnect = useCallback(async (): Promise<void> => {
    if (!deviceForWallet || !isMountedRef.current) return
    try {
      await LedgerService.ensureConnection(deviceForWallet.id)
      if (!isMountedRef.current) return
      setIsLedgerConnected(true)
    } catch {
      if (!isMountedRef.current) return
      setIsLedgerConnected(false)
    }
  }, [deviceForWallet])

  // Initiate BLE connection when entering connecting phase
  useEffect(() => {
    if (!isLedger || !isConnecting || !deviceForWallet) return
    handleReconnect()
  }, [isLedger, isConnecting, deviceForWallet, handleReconnect])

  // Poll for device connection and Avalanche app status
  useEffect(() => {
    if (!isLedger || !isConnecting) return

    const checkDeviceReady = async (): Promise<void> => {
      try {
        const connected = LedgerService.isConnected()
        setIsLedgerConnected(connected)
        if (connected) {
          const appType = LedgerService.getCurrentAppType()
          setIsAvalancheAppOpen(appType === LedgerAppType.AVALANCHE)
        } else {
          setIsAvalancheAppOpen(false)
        }
      } catch {
        setIsLedgerConnected(false)
        setIsAvalancheAppOpen(false)
      }
    }

    checkDeviceReady()
    const pollInterval = setInterval(
      checkDeviceReady,
      LEDGER_DEVICE_BRIEF_DELAY_MS
    )
    return () => clearInterval(pollInterval)
  }, [isLedger, isConnecting])

  const connectionStatus = useMemo((): string => {
    if (!isLedgerConnected) {
      return deviceForWallet
        ? `Connect ${deviceForWallet.name} and open the Avalanche app`
        : 'Connect your Ledger and open the Avalanche app'
    }
    if (!isAvalancheAppOpen) {
      return deviceForWallet
        ? `Open the Avalanche app on ${deviceForWallet.name}`
        : 'Open the Avalanche app on your Ledger'
    }
    return 'Ready — starting transaction...'
  }, [isLedgerConnected, isAvalancheAppOpen, deviceForWallet])

  return {
    isLedgerConnected,
    isAvalancheAppOpen,
    deviceForWallet,
    handleReconnect,
    connectionStatus
  }
}
