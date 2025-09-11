import React from 'react'
import { useRouter } from 'expo-router'
import { EnhancedLedgerSetup } from 'new/features/ledger/components'

export default function EnhancedLedgerSetupScreen(): JSX.Element {
  const router = useRouter()

  const handleComplete = (walletId: string) => {
    // Navigate to account management after successful wallet creation
    router.push('/accountSettings/manageAccounts')
  }

  const handleCancel = () => {
    // Go back to the import wallet screen
    router.back()
  }

  return (
    <EnhancedLedgerSetup
      onComplete={handleComplete}
      onCancel={handleCancel}
    />
  )
}
