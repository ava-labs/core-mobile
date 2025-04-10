import React from 'react'
import { useRouter } from 'expo-router'
import { CopyCode as CopyCodeComponent } from 'features/onboarding/components/CopyCode'
import { Loader } from 'common/components/Loader'
import { useSeedlessManageRecoveryMethodsContext } from 'features/accountSettings/context/SeedlessManageRecoveryMethodsProvider'

export default function CopyCode(): JSX.Element {
  const { handleCopyCode, totpKey } = useSeedlessManageRecoveryMethodsContext()
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
