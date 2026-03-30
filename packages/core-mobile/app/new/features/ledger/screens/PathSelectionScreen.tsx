import React, { useCallback } from 'react'
import { DerivationPathSelector } from 'new/features/ledger/components/DerivationPathSelector'
import { useLedgerSetupContext } from 'new/features/ledger/contexts/LedgerSetupContext'
import { LedgerDerivationPathType } from 'services/ledger/types'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useSelector } from 'react-redux'
import { selectWalletState } from 'store/app'
import { WalletState } from 'store/app/types'

interface PathSelectionScreenProps {
  onNavigateToDeviceConnection: (path: LedgerDerivationPathType) => void
}

export default function PathSelectionScreen({
  onNavigateToDeviceConnection
}: PathSelectionScreenProps): JSX.Element {
  const { setSelectedDerivationPath } = useLedgerSetupContext()
  const walletState = useSelector(selectWalletState)

  const handleDerivationPathSelect = useCallback(
    (derivationPathType: LedgerDerivationPathType) => {
      const isBIP44 = derivationPathType === LedgerDerivationPathType.BIP44
      if (walletState === WalletState.NONEXISTENT) {
        AnalyticsService.capture(
          isBIP44
            ? 'OnboardingLedgerDerivationPathBIP44Selected'
            : 'OnboardingLedgerDerivationPathLedgerLiveSelected'
        )
      } else {
        AnalyticsService.capture(
          isBIP44
            ? 'WalletImportLedgerDerivationPathBIP44Selected'
            : 'WalletImportLedgerDerivationPathLedgerLiveSelected'
        )
      }
      setSelectedDerivationPath(derivationPathType)
      onNavigateToDeviceConnection(derivationPathType)
    },
    [setSelectedDerivationPath, onNavigateToDeviceConnection, walletState]
  )

  return <DerivationPathSelector onSelect={handleDerivationPathSelect} />
}
