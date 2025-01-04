import React from 'react'
import { useRecoveryMethodContext } from 'features/onboarding/contexts/RecoveryMethodProvider'
import { useRouter } from 'expo-router'
import { CopyCode as CopyCodeComponent } from 'features/onboarding/components/CopyCode'
import { Loader } from 'common/components/Loader'

export default function CopyCode(): JSX.Element {
  const { handleCopyCode, totpKey } = useRecoveryMethodContext()
  const router = useRouter()

  const handleBack = (): void => {
    router.canGoBack() && router.back()
  }

  if (totpKey === undefined) {
    return <Loader />
  }

  return (
    <CopyCodeComponent
      totpKey={totpKey}
      onCopyCode={handleCopyCode}
      onBack={handleBack}
    />
  )
}
