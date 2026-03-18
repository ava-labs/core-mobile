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
  appType?: LedgerAppType
}

type UseLedgerBLEConnectionReturn = {
  isLedgerConnected: boolean
  isAvalancheAppOpen: boolean
  isReconnecting: boolean
  deviceForWallet: LedgerDevice | undefined
  handleReconnect: () => Promise<void>
  connectionStatus: string
}

export const useLedgerBLEConnection = ({
  isLedger,
  isConnecting,
  appType = LedgerAppType.AVALANCHE
}: UseLedgerBLEConnectionParams): UseLedgerBLEConnectionReturn => {
  const [isLedgerConnected, setIsLedgerConnected] = useState(false)
  const [isAvalancheAppOpen, setIsAvalancheAppOpen] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)

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
    setIsReconnecting(true)
    try {
      await LedgerService.ensureConnection(deviceForWallet.id)
      if (!isMountedRef.current) return
      setIsLedgerConnected(true)
    } catch {
      if (!isMountedRef.current) return
      setIsLedgerConnected(false)
    } finally {
      if (isMountedRef.current) {
        setIsReconnecting(false)
      }
    }
  }, [deviceForWallet])

  // Initiate BLE connection when entering connecting phase
  useEffect(() => {
    if (!isLedger || !isConnecting || !deviceForWallet) return
    handleReconnect()
  }, [isLedger, isConnecting, deviceForWallet, handleReconnect])

  // Poll for device connection and required app status
  useEffect(() => {
    if (!isLedger || !isConnecting) return

    const checkDeviceReady = async (): Promise<void> => {
      try {
        const connected = LedgerService.isConnected()
        setIsLedgerConnected(connected)
        if (connected) {
          const currentAppType = LedgerService.getCurrentAppType()
          setIsAvalancheAppOpen(currentAppType === appType)
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
  }, [isLedger, isConnecting, appType])

  const connectionStatus = useMemo((): string => {
    if (!isLedgerConnected) {
      return deviceForWallet
        ? `Connect ${deviceForWallet.name} and open the ${appType} app`
        : `Connect your Ledger and open the ${appType} app`
    }
    if (!isAvalancheAppOpen) {
      return deviceForWallet
        ? `Open the ${appType} app on ${deviceForWallet.name}`
        : `Open the ${appType} app on your Ledger`
    }
    return 'Ready — starting transaction...'
  }, [isLedgerConnected, isAvalancheAppOpen, deviceForWallet, appType])

  return {
    isLedgerConnected,
    isAvalancheAppOpen,
    isReconnecting,
    deviceForWallet,
    handleReconnect,
    connectionStatus
  }
}
