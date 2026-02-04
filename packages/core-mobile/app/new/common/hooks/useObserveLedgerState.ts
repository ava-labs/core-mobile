import { useLedgerWallet } from 'features/ledger/hooks/useLedgerWallet'
import { useLedgerWalletMap } from 'features/ledger/store'
import { LedgerAppType } from 'services/ledger/types'
import { useEffect, useMemo, useState } from 'react'
import LedgerService from 'services/ledger/LedgerService'
import { useSelector } from 'react-redux'
import { selectWalletById } from 'store/wallet/slice'
import { WalletType } from 'services/wallet/types'

export const useObserveLedgerState = (
  walletId: string,
  appType: LedgerAppType
): {
  isAppOpened: boolean
  isLedger: boolean
} => {
  const { transportState } = useLedgerWallet()
  const { ledgerWalletMap } = useLedgerWalletMap()
  const wallet = useSelector(selectWalletById(walletId))
  const [isAvalancheAppOpened, setIsAvalancheAppOpened] = useState(false)

  const deviceForWallet = useMemo(() => {
    return ledgerWalletMap[walletId]
  }, [ledgerWalletMap, walletId])

  const [isConnected, setIsConnected] = useState(false)

  const isLedger = useMemo(() => {
    return (
      wallet?.type === WalletType.LEDGER_LIVE ||
      wallet?.type === WalletType.LEDGER
    )
  }, [wallet?.type])

  useEffect(() => {
    if (isConnected === false) {
      setIsAvalancheAppOpened(false)
      return
    }

    const intervalId = setInterval(() => {
      LedgerService.checkApp(appType)
        .then(isOpened => {
          setIsAvalancheAppOpened(isOpened)
        })
        .catch(() => {
          setIsAvalancheAppOpened(false)
        })
    }, 2000)

    return () => clearInterval(intervalId)
  }, [appType, isConnected, transportState.available])

  useEffect(() => {
    async function checkAppIsOpened(): Promise<void> {
      if (isLedger && deviceForWallet?.deviceId && transportState.available) {
        setIsConnected(false)
        try {
          await LedgerService.ensureConnection(deviceForWallet.deviceId)
          setIsConnected(true)
        } catch (error) {
          setIsConnected(false)
        }
      } else {
        setIsConnected(false)
      }
    }
    checkAppIsOpened()
  }, [deviceForWallet?.deviceId, isLedger, transportState.available])

  return { isAppOpened: isAvalancheAppOpened, isLedger }
}
