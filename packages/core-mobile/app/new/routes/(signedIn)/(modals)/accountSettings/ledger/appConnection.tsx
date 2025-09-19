import React, { useCallback, useEffect } from 'react'
import { useRouter } from 'expo-router'
import { LedgerAppConnection } from 'new/features/ledger/components/LedgerAppConnection'
import { useLedgerSetupContext } from 'new/features/ledger/contexts/LedgerSetupContext'

export default function AppConnectionScreen(): JSX.Element {
  const { push, back } = useRouter()

  const {
    getSolanaKeys,
    getAvalancheKeys,
    connectedDeviceName,
    selectedDerivationPath,
    keys,
    resetSetup,
    disconnectDevice
  } = useLedgerSetupContext()

  // Check if keys are available and auto-progress to setup
  useEffect(() => {
    if (keys.avalancheKeys && keys.solanaKeys.length > 0) {
      // @ts-ignore TODO: make routes typesafe
      push('/accountSettings/ledger/setupProgress')
    }
  }, [keys.avalancheKeys, keys.solanaKeys, push])

  const handleComplete = useCallback(() => {
    // @ts-ignore TODO: make routes typesafe
    push('/accountSettings/ledger/setupProgress')
  }, [push])

  const handleCancel = useCallback(async () => {
    await disconnectDevice()
    resetSetup()
    back()
  }, [disconnectDevice, resetSetup, back])

  return (
    <LedgerAppConnection
      onComplete={handleComplete}
      onCancel={handleCancel}
      getSolanaKeys={getSolanaKeys}
      getAvalancheKeys={getAvalancheKeys}
      deviceName={connectedDeviceName}
      selectedDerivationPath={selectedDerivationPath}
    />
  )
}
