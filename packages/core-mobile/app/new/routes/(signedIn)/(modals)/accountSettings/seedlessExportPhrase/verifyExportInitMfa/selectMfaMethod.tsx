import { SelectRecoveryMethods } from 'features/accountSettings/components/SelectRecoveryMethods'
import React from 'react'
import { MFA } from 'seedless/types'
import { useState, useEffect, useCallback } from 'react'
import { RecoveryMethod } from 'features/onboarding/hooks/useAvailableRecoveryMethods'
import { useRouter } from 'expo-router'
import { useSeedlessMnemonicExportContext } from 'features/accountSettings/context/SeedlessMnemonicExportProvider'
import useVerifyMFA from 'common/hooks/useVerifyMFA'

const SelectMfaMethodScreen = (): React.JSX.Element => {
  const { navigate } = useRouter()
  const {
    seedlessExportService,
    userExportInitResponse,
    onVerifyExportInitSuccess
  } = useSeedlessMnemonicExportContext()
  const { verifyFido } = useVerifyMFA(seedlessExportService.session)
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
      mfaMethods={mfaMethods}
      onSelectMfa={handleSelectMfa}
      sx={{ marginHorizontal: 16 }}
    />
  )
}

export default SelectMfaMethodScreen
