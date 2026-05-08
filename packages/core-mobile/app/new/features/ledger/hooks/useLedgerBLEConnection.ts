import { LEDGER_DEVICE_BRIEF_DELAY_MS } from 'features/ledger/consts'
import { useLedgerWalletMap } from 'features/ledger/store'
import { isBitcoinCompatibleApp } from 'features/ledger/utils'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert } from 'react-native'
import { useSelector } from 'react-redux'
import {
  isLedgerBluetoothError,
  isLedgerConnectionFailed,
  showBluetoothErrorAlert,
  LEDGER_CONNECTION_FAILED_TITLE,
  LEDGER_CONNECTION_FAILED_ALREADY_CONNECTED_MESSAGE
} from 'services/ledger/LedgerBluetoothError'
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
  isUnsupportedBtcVersion: boolean
  currentBtcVersion: string
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
  const [isUnsupportedBtcVersion, setIsUnsupportedBtcVersion] = useState(false)
  const [currentBtcVersion, setCurrentBtcVersion] = useState('')
  const [isReconnecting, setIsReconnecting] = useState(false)

  const isMountedRef = useRef(true)
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Subscribe to LedgerService connection state changes for immediate
  // UI feedback when the BLE link drops or is restored (e.g. after
  // Ledger auto-sleep / wake or app foreground resume).
  useEffect(() => {
    if (!isLedger) return

    return LedgerService.addConnectionStateListener((connected: boolean) => {
      if (!isMountedRef.current) return
      setIsLedgerConnected(connected)
      if (!connected) {
        setIsAvalancheAppOpen(false)
        setIsUnsupportedBtcVersion(false)
        setCurrentBtcVersion('')
      }
    })
  }, [isLedger])

  const activeWalletId = useSelector(selectActiveWalletId)
  const { getLedgerInfoByWalletId } = useLedgerWalletMap()
  const deviceForWallet = useMemo(
    () => getLedgerInfoByWalletId(activeWalletId)?.device,
    [getLedgerInfoByWalletId, activeWalletId]
  )

  // Track the last app type we attempted to open so we don't spam the
  // open-app APDU every poll tick, but still retry when appType changes.
  const lastOpenAppAttemptRef = useRef<LedgerAppType | null>(null)

  // Reset connection state when a new connecting phase begins
  useEffect(() => {
    if (isConnecting) {
      setIsLedgerConnected(false)
      setIsAvalancheAppOpen(false)
      setIsUnsupportedBtcVersion(false)
      setCurrentBtcVersion('')
      lastOpenAppAttemptRef.current = null
    }
  }, [isConnecting])

  const handleReconnect = useCallback(async (): Promise<void> => {
    if (!deviceForWallet || !isMountedRef.current) return
    setIsReconnecting(true)
    try {
      await LedgerService.connect(deviceForWallet.id)
      if (!isMountedRef.current) return
      setIsLedgerConnected(true)
    } catch (err) {
      if (!isMountedRef.current) return
      setIsLedgerConnected(false)
      if (isLedgerBluetoothError(err)) {
        showBluetoothErrorAlert(err)
        return
      }
      if (isLedgerConnectionFailed(err)) {
        Alert.alert(
          LEDGER_CONNECTION_FAILED_TITLE,
          LEDGER_CONNECTION_FAILED_ALREADY_CONNECTED_MESSAGE
        )
      }
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

  // Check device connection and required app status.
  // Extracted from useEffect to reduce nesting depth.
  const checkDeviceReady = useCallback(async (): Promise<void> => {
    try {
      const connected = LedgerService.isConnected()
      setIsLedgerConnected(connected)
      if (!connected) {
        setIsAvalancheAppOpen(false)
        setIsUnsupportedBtcVersion(false)
        setCurrentBtcVersion('')
        return
      }
      const currentAppType = LedgerService.getCurrentAppType()
      if (appType !== LedgerAppType.BITCOIN) {
        const isCorrectApp = currentAppType === appType
        setIsAvalancheAppOpen(isCorrectApp)
        setIsUnsupportedBtcVersion(false)
        setCurrentBtcVersion('')

        // Proactively quit the current app and open the required one.
        // openApp handles quit→open internally and is best-effort.
        if (!isCorrectApp && lastOpenAppAttemptRef.current !== appType) {
          lastOpenAppAttemptRef.current = appType
          LedgerService.openApp(appType).catch(() => undefined)
        }
        return
      }
      const version = LedgerService.getCurrentAppVersion()
      if (!version) {
        // Version not yet populated; wait for the next poll
        setIsAvalancheAppOpen(false)
        setIsUnsupportedBtcVersion(false)
        setCurrentBtcVersion('')
        return
      }
      const compatible = isBitcoinCompatibleApp(currentAppType, version)
      const unsupported =
        currentAppType === LedgerAppType.BITCOIN && !compatible
      setIsAvalancheAppOpen(compatible)
      setIsUnsupportedBtcVersion(unsupported)
      setCurrentBtcVersion(unsupported ? version : '')
    } catch {
      setIsLedgerConnected(false)
      setIsAvalancheAppOpen(false)
    }
  }, [appType])

  // Poll for device connection and required app status
  useEffect(() => {
    if (!isLedger || !isConnecting) return

    checkDeviceReady()
    const pollInterval = setInterval(
      checkDeviceReady,
      LEDGER_DEVICE_BRIEF_DELAY_MS
    )
    return () => clearInterval(pollInterval)
  }, [isLedger, isConnecting, checkDeviceReady])

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
    isUnsupportedBtcVersion,
    currentBtcVersion,
    isReconnecting,
    deviceForWallet,
    handleReconnect,
    connectionStatus
  }
}
