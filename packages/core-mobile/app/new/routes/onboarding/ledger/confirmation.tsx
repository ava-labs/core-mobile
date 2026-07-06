import { Confirmation as Component } from 'features/onboarding/components/Confirmation'
import { useWallet } from 'hooks/useWallet'
import { useLedgerSetupContext } from 'features/ledger'
import { LedgerDerivationPathType } from 'services/ledger/types'
import { WalletType } from 'services/wallet/types'
import Logger from 'utils/Logger'
import React, { useCallback } from 'react'
import { onWalletImported } from 'store/app'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveWalletId } from 'store/wallet/slice'

export default function Confirmation(): JSX.Element {
  const { login } = useWallet()
  const walletId = useSelector(selectActiveWalletId)
  const dispatch = useDispatch()
  const { selectedDerivationPath } = useLedgerSetupContext()

  const handleNext = useCallback((): void => {
    if (!walletId) {
      Logger.error('No wallet ID found for Ledger wallet after creation')
      return
    }
    const walletType =
      selectedDerivationPath === LedgerDerivationPathType.LedgerLive
        ? WalletType.LEDGER_LIVE
        : WalletType.LEDGER

    dispatch(onWalletImported({ walletId, walletType }))

    login(walletType).catch(Logger.error)
  }, [dispatch, login, walletId, selectedDerivationPath])

  return <Component onNext={handleNext} />
}
