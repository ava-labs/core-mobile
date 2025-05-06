import { useUserMfa } from 'common/hooks/useUserMfa'
import { useVerifyRecoveryMethods } from 'common/hooks/useVerifyRecoveryMethods'
import { useRouter } from 'expo-router'
import { SelectRecoveryMethods } from 'features/accountSettings/components/SelectRecoveryMethods'
import { useSeedlessMnemonicExportContext } from 'features/accountSettings/context/SeedlessMnemonicExportProvider'
import { RecoveryMethod } from 'features/onboarding/hooks/useAvailableRecoveryMethods'
import React, { useCallback } from 'react'

const SelectMfaMethodScreen = (): React.JSX.Element => {
  const { navigate } = useRouter()
  const {
    seedlessExportService,
    userExportInitResponse,
    onVerifyExportInitSuccess
  } = useSeedlessMnemonicExportContext()
  const { verifyFido } = useVerifyRecoveryMethods(seedlessExportService.session)
  const { canGoBack, back } = useRouter()
  const { data: mfaMethods, isLoading } = useUserMfa()

  const handleSelectMfa = useCallback(
    async (recoveryMethod: RecoveryMethod): Promise<void> => {
      if (recoveryMethod.mfa?.type === 'totp') {
        navigate(
          // @ts-ignore TODO: make routes typesafe
          '/accountSettings/seedlessExportPhrase/verifyExportInitMfa/verifyTotpCode'
        )
        return
      }

      const mfaId = userExportInitResponse?.mfaId()
      if (
        recoveryMethod.mfa?.type === 'fido' &&
        mfaId &&
        userExportInitResponse
      ) {
        await verifyFido({
          mfaId,
          response: userExportInitResponse,
          onVerifySuccess: verifiedResponse => {
            canGoBack() && back()
            onVerifyExportInitSuccess(verifiedResponse)
          }
        })
      }
    },
    [
      back,
      canGoBack,
      navigate,
      onVerifyExportInitSuccess,
      userExportInitResponse,
      verifyFido
    ]
  )

  return (
    <SelectRecoveryMethods
      mfaMethods={mfaMethods ?? []}
      onSelectMfa={handleSelectMfa}
      isLoading={isLoading}
    />
  )
}

export default SelectMfaMethodScreen
