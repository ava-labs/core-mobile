import React from 'react'
import { useRouter } from 'expo-router'
import { EnhancedLedgerSetup } from 'new/features/ledger/components'

export default function EnhancedLedgerSetupScreen(): JSX.Element {
  const router = useRouter()

  const handleComplete = (): void => {
    // Navigate to account management after successful wallet creation
    // @ts-ignore TODO: make routes typesafe
    router.push('/accountSettings/manageAccounts')
  }

  const handleCancel = (): void => {
    router.back()
  }

  return (
    <EnhancedLedgerSetup onComplete={handleComplete} onCancel={handleCancel} />
  )
}
