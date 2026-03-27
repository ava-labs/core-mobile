import { Confirmation as Component } from 'features/onboarding/components/Confirmation'
import { useWallet } from 'hooks/useWallet'
import { useLedgerSetupContext } from 'features/ledger'
import { LedgerDerivationPathType } from 'services/ledger/types'
import { WalletType } from 'services/wallet/types'
import Logger from 'utils/Logger'
import React from 'react'

export default function Confirmation(): JSX.Element {
  const { login } = useWallet()
  const { selectedDerivationPath } = useLedgerSetupContext()

  const walletType =
    selectedDerivationPath === LedgerDerivationPathType.LedgerLive
      ? WalletType.LEDGER_LIVE
      : WalletType.LEDGER

  const handleNext = (): void => {
    login(walletType).catch(Logger.error)
  }

  return <Component onNext={handleNext} />
}
