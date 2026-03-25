import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { DerivationPathSelector } from 'new/features/ledger/components/DerivationPathSelector'
import { useLedgerSetupContext } from 'new/features/ledger/contexts/LedgerSetupContext'
import { LedgerDerivationPathType } from 'services/ledger/types'
import AnalyticsService from 'services/analytics/AnalyticsService'

interface PathSelectionScreenProps {
  onNavigateToDeviceConnection: (path: LedgerDerivationPathType) => void
}

export default function PathSelectionScreen({
  onNavigateToDeviceConnection
}: PathSelectionScreenProps): JSX.Element {
  const { back } = useRouter()
  const { setSelectedDerivationPath, resetSetup } = useLedgerSetupContext()

  const handleDerivationPathSelect = useCallback(
    (derivationPathType: LedgerDerivationPathType) => {
      AnalyticsService.capture(
        derivationPathType === LedgerDerivationPathType.BIP44
          ? 'LedgerDerivationPathBIP44Selected'
          : 'LedgerDerivationPathLedgerLiveSelected'
      )
      setSelectedDerivationPath(derivationPathType)
      onNavigateToDeviceConnection(derivationPathType)
    },
    [setSelectedDerivationPath, onNavigateToDeviceConnection]
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
