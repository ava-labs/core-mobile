import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { VerifyCode as VerifyCodeComponent } from 'features/onboarding/components/VerifyCode'
import { useSeedlessManageRecoveryMethodsContext } from 'features/accountSettings/context/SeedlessManageRecoveryMethodsProvider'
import { showSnackbar } from 'common/utils/toast'
import { Result } from 'types/result'
import { TotpErrors } from 'seedless/errors'

export default function VerifyCode(): JSX.Element {
  const { verifiedTotpChallenge } = useSeedlessManageRecoveryMethodsContext()
  const router = useRouter()

  const onVerifyCode = useCallback(
    async (code: string): Promise<Result<undefined, TotpErrors>> => {
      if (!verifiedTotpChallenge)
        return {
          success: false,
          error: new TotpErrors({
            name: 'UnexpectedError',
            message: 'Missing totpChallengeResponse'
          })
        }

      await verifiedTotpChallenge.answer(code)
      return { success: true, value: undefined }
    },
    [verifiedTotpChallenge]
  )

  const onVerifySuccess = useCallback((): void => {
    router.dismissAll()
    router.back()
    showSnackbar('Authenticator Changed')
  }, [router])

  return (
    <VerifyCodeComponent
      onVerifyCode={onVerifyCode}
      onVerifySuccess={onVerifySuccess}
      sx={{ marginTop: 25 }}
    />
  )
}
