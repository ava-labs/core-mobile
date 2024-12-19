import React from 'react'
import { useSignupContext } from 'new/contexts/SignupProvider'
import { useRouter } from 'expo-router'
import { CopyCode as CopyCodeComponent } from '../../components/totp/CopyCode'
import { Loader } from '../../components/totp/Loader'

export default function CopyCode(): JSX.Element {
  const { handleCopyCode, totpKey } = useSignupContext()
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
