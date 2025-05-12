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
    userExportCompleteResponse,
    onVerifyExportCompleteSuccess
  } = useSeedlessMnemonicExportContext()
  const { verifyFido } = useVerifyRecoveryMethods(seedlessExportService.session)
  const { canGoBack, back } = useRouter()
  const { data: mfaMethods, isLoading } = useUserMfa()

  const handleSelectMfa = useCallback(
    async (recoveryMethod: RecoveryMethod): Promise<void> => {
      if (recoveryMethod.mfa?.type === 'totp') {
        navigate(
          // @ts-ignore TODO: make routes typesafe
          '/accountSettings/seedlessExportPhrase/verifyExportCompleteMfa/verifyTotpCode'
        )
        return
      }

      const mfaId = userExportCompleteResponse?.mfaId()
      if (
        recoveryMethod.mfa?.type === 'fido' &&
        mfaId &&
        userExportCompleteResponse
      ) {
        await verifyFido({
          mfaId,
          response: userExportCompleteResponse,
          onVerifySuccess: verifiedResponse => {
            canGoBack() && back()
            onVerifyExportCompleteSuccess(verifiedResponse)
          }
        })
      }
    },
    [
      back,
      canGoBack,
      navigate,
      onVerifyExportCompleteSuccess,
      userExportCompleteResponse,
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
