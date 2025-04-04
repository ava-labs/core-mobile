import { SelectRecoveryMethods } from 'features/accountSettings/components/SelectRecoveryMethods'
import React from 'react'
import { MFA } from 'seedless/types'
import { useState, useEffect, useCallback } from 'react'
import { RecoveryMethod } from 'features/onboarding/hooks/useAvailableRecoveryMethods'
import { useRouter } from 'expo-router'
import { useSeedlessMnemonicExportContext } from 'features/accountSettings/context/SeedlessMnemonicExportProvider'
import { useVerifyRecoveryMethods } from 'common/hooks/useVerifyRecoveryMethods'

const SelectMfaMethodScreen = (): React.JSX.Element => {
  const { navigate } = useRouter()
  const {
    seedlessExportService,
    userExportCompleteResponse,
    onVerifyExportCompleteSuccess
  } = useSeedlessMnemonicExportContext()
  const { verifyFido } = useVerifyRecoveryMethods(seedlessExportService.session)
  const [mfaMethods, setMfaMethods] = useState<MFA[]>([])
  const { canGoBack, back } = useRouter()

  useEffect(() => {
    const getMfaMethods = async (): Promise<void> => {
      const mfas = await seedlessExportService.session.userMfa()
      setMfaMethods(mfas)
    }
    getMfaMethods()
  }, [seedlessExportService.session])

  const handleSelectMfa = useCallback(
    async (recoveryMethod: RecoveryMethod): Promise<void> => {
      if (recoveryMethod.mfa?.type === 'totp') {
        navigate('./verifyTotpCode')
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
      mfaMethods={mfaMethods}
      onSelectMfa={handleSelectMfa}
      sx={{ marginHorizontal: 16 }}
    />
  )
}

export default SelectMfaMethodScreen
