import React from 'react'
import { useSignupContext } from 'new/contexts/SignupProvider'
import { CopyCode as CopyCodeComponent } from '../components/CopyCode'
import { Loader } from '../components/Loader'

export default function CopyCode(): JSX.Element {
  const { handleCopyCode, handleBack, totpKey } = useSignupContext()

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
