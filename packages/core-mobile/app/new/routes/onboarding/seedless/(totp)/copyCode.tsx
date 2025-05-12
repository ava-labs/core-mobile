import { useRouter } from 'expo-router'
import { CopyCode as CopyCodeComponent } from 'features/onboarding/components/CopyCode'
import { useRecoveryMethodContext } from 'features/onboarding/contexts/RecoveryMethodProvider'
import React from 'react'

export default function CopyCode(): JSX.Element {
  const { handleCopyCode, totpKey } = useRecoveryMethodContext()
  const router = useRouter()

  const handleBack = (): void => {
    router.canGoBack() && router.back()
  }

  return (
    <CopyCodeComponent
      totpKey={totpKey}
      onCopyCode={handleCopyCode}
      onBack={handleBack}
      isLoading={totpKey === undefined}
    />
  )
}
