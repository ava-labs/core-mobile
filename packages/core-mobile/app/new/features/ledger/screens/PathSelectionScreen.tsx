import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { DerivationPathSelector } from 'new/features/ledger/components/DerivationPathSelector'
import { useLedgerSetupContext } from 'new/features/ledger/contexts/LedgerSetupContext'
import { LedgerDerivationPathType } from 'services/ledger/types'

interface PathSelectionScreenProps {
  onNavigateToDeviceConnection?: (path: LedgerDerivationPathType) => void
  onCancel?: () => void
}

export default function PathSelectionScreen({
  onNavigateToDeviceConnection,
  onCancel
}: PathSelectionScreenProps = {}): JSX.Element {
  const { push, back } = useRouter()
  const { setSelectedDerivationPath, resetSetup } = useLedgerSetupContext()

  const handleDerivationPathSelect = useCallback(
    (derivationPathType: LedgerDerivationPathType) => {
      setSelectedDerivationPath(derivationPathType)
      if (onNavigateToDeviceConnection) {
        onNavigateToDeviceConnection(derivationPathType)
      } else {
        push('/accountSettings/ledger/deviceConnection')
      }
    },
    [setSelectedDerivationPath, push, onNavigateToDeviceConnection]
  )

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel()
    } else {
      resetSetup()
      back()
    }
  }, [resetSetup, back, onCancel])

  return (
    <DerivationPathSelector
      onSelect={handleDerivationPathSelect}
      onCancel={handleCancel}
    />
  )
}
