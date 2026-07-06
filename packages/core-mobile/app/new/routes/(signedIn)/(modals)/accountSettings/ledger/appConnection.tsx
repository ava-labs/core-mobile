import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { AppConnectionOnboardingScreen } from 'new/features/ledger/screens/AppConnectionOnboardingScreen'
import { LedgerDerivationPathType } from 'services/ledger/types'
import { WalletType } from 'services/wallet/types'
import { onWalletImported } from 'store/app/slice'
import { useDispatch } from 'react-redux'
import { useLedgerSetupContext } from 'features/ledger'

export default function AppConnection(): JSX.Element {
  const { navigate } = useRouter()
  const dispatch = useDispatch()
  const { selectedDerivationPath } = useLedgerSetupContext()

  const handleNavigateToComplete = useCallback(
    (walletId?: string) => {
      if (!walletId) {
        navigate('/accountSettings/ledger/complete')
        return
      }
      // Trigger background discovery for accounts 1-9.
      // This runs after navigation — the user doesn't wait.
      const walletType =
        selectedDerivationPath === LedgerDerivationPathType.BIP44
          ? WalletType.LEDGER
          : WalletType.LEDGER_LIVE

      dispatch(onWalletImported({ walletId, walletType }))
      navigate('/accountSettings/ledger/complete')
    },
    [selectedDerivationPath, navigate, dispatch]
  )

  return (
    <AppConnectionOnboardingScreen
      onNavigateToComplete={handleNavigateToComplete}
      showConnectionToasts={true}
      showCancelOnComplete={true}
    />
  )
}
