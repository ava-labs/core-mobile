import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { DerivationPathSelector } from 'new/features/ledger/components/DerivationPathSelector'
import { useLedgerSetupContext } from 'new/features/ledger/contexts/LedgerSetupContext'
import { LedgerDerivationPathType } from 'services/wallet/LedgerWallet'

export default function PathSelectionScreen(): JSX.Element {
  const { push, back } = useRouter()
  const { setSelectedDerivationPath, resetSetup } = useLedgerSetupContext()

  const handleDerivationPathSelect = useCallback(
    (derivationPathType: LedgerDerivationPathType) => {
      setSelectedDerivationPath(derivationPathType)
      // Navigate to device connection step
      // @ts-ignore TODO: make routes typesafe
      push('/accountSettings/ledger/deviceConnection')
    },
    [setSelectedDerivationPath, push]
  )

  const handleCancel = useCallback(() => {
    resetSetup()
    back()
  }, [resetSetup, back])

  return (
    <DerivationPathSelector
      onSelect={handleDerivationPathSelect}
      onCancel={handleCancel}
    />
  )
}
