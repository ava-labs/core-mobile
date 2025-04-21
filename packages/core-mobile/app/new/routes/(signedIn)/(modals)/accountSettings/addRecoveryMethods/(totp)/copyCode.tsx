import React from 'react'
import { CopyCode as CopyCodeComponent } from 'features/onboarding/components/CopyCode'
import { Loader } from 'common/components/Loader'
import { useRecoveryMethodsContext } from 'features/accountSettings/context/RecoverMethodsProvider'
import { useDebouncedRouter } from 'common/utils/useDebouncedRouter'

export default function CopyCode(): JSX.Element {
  const { handleCopyCode, totpKey } = useRecoveryMethodsContext()
  const router = useDebouncedRouter()

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
