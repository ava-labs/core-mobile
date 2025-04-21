import React from 'react'
import { useRecoveryMethodContext } from 'features/onboarding/contexts/RecoveryMethodProvider'
import { ScanQrCode as ScanQrCodeComponent } from 'features/onboarding/components/ScanQrCode'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { useDebouncedRouter } from 'common/utils/useDebouncedRouter'

export default function ScanQrCode(): JSX.Element {
  const { totpChallenge } = useRecoveryMethodContext()
  const router = useDebouncedRouter()

  const goToVerifyCode = (): void => {
    router.push('./verifyCode')
  }

  const goToEnterCodeManually = (): void => {
    router.navigate('./copyCode')
  }

  return (
    <BlurredBarsContentLayout>
      <ScanQrCodeComponent
        totpChallenge={totpChallenge}
        onEnterCodeManually={goToEnterCodeManually}
        onVerifyCode={goToVerifyCode}
      />
    </BlurredBarsContentLayout>
  )
}
