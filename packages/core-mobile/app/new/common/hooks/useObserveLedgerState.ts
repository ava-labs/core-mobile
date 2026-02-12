import { useLedgerWallet } from 'features/ledger/hooks/useLedgerWallet'
import { LedgerAppType } from 'services/ledger/types'
import { useEffect, useMemo, useState } from 'react'
import LedgerService from 'services/ledger/LedgerService'
import { useSelector } from 'react-redux'
import { selectWalletById } from 'store/wallet/slice'
import { WalletType } from 'services/wallet/types'
import { useLedgerDeviceInfo } from 'features/ledger/hooks/useLedgerDeviceInfo'

export const useObserveLedgerState = (
  walletId: string,
  appType: LedgerAppType
): {
  isAppOpened: boolean
  isLedger: boolean
} => {
  const { transportState } = useLedgerWallet()
  const { device } = useLedgerDeviceInfo(walletId)
  const wallet = useSelector(selectWalletById(walletId))
  const [isAppOpened, setIsAppOpened] = useState(false)

  const [isConnected, setIsConnected] = useState(false)

  const isLedger = useMemo(() => {
    return (
      wallet?.type === WalletType.LEDGER_LIVE ||
      wallet?.type === WalletType.LEDGER
    )
  }, [wallet?.type])

  useEffect(() => {
    if (isConnected === false) {
      setIsAppOpened(false)
      return
    }

    const intervalId = setInterval(() => {
      LedgerService.checkApp(appType)
        .then(isOpened => {
          setIsAppOpened(isOpened)
        })
        .catch(() => {
          setIsAppOpened(false)
        })
    }, 2000)

    return () => clearInterval(intervalId)
  }, [appType, isConnected, transportState.available])

  useEffect(() => {
    async function checkAppIsOpened(): Promise<void> {
      if (isLedger && device?.id && transportState.available) {
        setIsConnected(false)
        try {
          await LedgerService.ensureConnection(device.id)
          setIsConnected(true)
        } catch (error) {
          setIsConnected(false)
        }
      } else {
        setIsConnected(false)
      }
    }
    checkAppIsOpened()
  }, [device, isLedger, transportState.available])

  return { isAppOpened, isLedger }
}
