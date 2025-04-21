import { SelectRecoveryMethods } from 'features/accountSettings/components/SelectRecoveryMethods'
import React from 'react'
import { useCallback } from 'react'
import { RecoveryMethod } from 'features/onboarding/hooks/useAvailableRecoveryMethods'
import { useSeedlessMnemonicExportContext } from 'features/accountSettings/context/SeedlessMnemonicExportProvider'
import { useVerifyRecoveryMethods } from 'common/hooks/useVerifyRecoveryMethods'
import { useUserMfa } from 'common/hooks/useUserMfa'
import { Loader } from 'common/components/Loader'
import { useDebouncedRouter } from 'common/utils/useDebouncedRouter'

const SelectMfaMethodScreen = (): React.JSX.Element => {
  const { navigate, canGoBack, back } = useDebouncedRouter()
  const {
    seedlessExportService,
    userExportInitResponse,
    onVerifyExportInitSuccess
  } = useSeedlessMnemonicExportContext()
  const { verifyFido } = useVerifyRecoveryMethods(seedlessExportService.session)
  const { data: mfaMethods, isLoading } = useUserMfa()

  const handleSelectMfa = useCallback(
    async (recoveryMethod: RecoveryMethod): Promise<void> => {
      if (recoveryMethod.mfa?.type === 'totp') {
        navigate('./verifyTotpCode')
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

  return isLoading ? (
    <Loader />
  ) : (
    <SelectRecoveryMethods
      mfaMethods={mfaMethods ?? []}
      onSelectMfa={handleSelectMfa}
      sx={{ marginHorizontal: 16 }}
    />
  )
}

export default SelectMfaMethodScreen
